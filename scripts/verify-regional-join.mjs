#!/usr/bin/env node
/**
 * Verifies the Storsthlm admission-cutoff <-> national gymnasium join
 * (`app/lib/gymnasium-regional.ts`, v2 task 4 of
 * agent/decisions/2026-07-29-skolranking-gymnasium-ranking-v2.md).
 *
 * Runs against the REAL data files (data/gymnasium.json,
 * data/storsthlm-admission.json) and the REAL matching/aggregation code --
 * not a reimplementation -- via a small ESM loader
 * (scripts/ts-relative-loader.mjs) that lets plain `node` import
 * app/lib/*.ts directly. There is no test framework in this repo (by
 * design -- see the v2-task-4 PR); this script is the durable,
 * re-runnable substitute the spec's "durability" point asks for. Re-run
 * this after every yearly data refresh (new gymnasium.json +
 * storsthlm-admission.json) to confirm the join still holds up.
 *
 * Exits non-zero if either hard invariant fails:
 *   1. No school ends up with a cutoff of exactly 0 (0 in the source means
 *      "no cutoff", never "cutoff of 0 points" -- see gymnasium-regional.ts).
 *   2. getAllGymnasiumSchools() -- the national ranking -- is byte-identical
 *      before and after the regional join runs. The regional layer must be
 *      100% additive; it must never touch rank/rankingScore or mutate the
 *      shared singleton array.
 *
 * Run: node scripts/verify-regional-join.mjs
 */

import { register } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
register("./ts-relative-loader.mjs", { parentURL: `file://${__dirname}/` });

const { getAllGymnasiumSchools } = await import("../app/lib/gymnasium.ts");
const { getRegionalJoinResult, getRegionalDataForGymnasiumId } = await import(
  "../app/lib/gymnasium-regional.ts"
);

let failed = false;
function fail(message) {
  failed = true;
  console.error(`FAIL: ${message}`);
}

// --- Snapshot the national ranking BEFORE touching the regional layer ---
const beforeSchools = getAllGymnasiumSchools();
const beforeSnapshot = JSON.stringify(beforeSchools);

// --- Run the join ---
const result = getRegionalJoinResult();

// --- Snapshot the national ranking AFTER, and compare ---
const afterSchools = getAllGymnasiumSchools();
const afterSnapshot = JSON.stringify(afterSchools);
const rankingUnchanged = beforeSnapshot === afterSnapshot;
const sameArrayIdentity = beforeSchools === afterSchools;

// --- Breakdown by match method ---
const byMethod = { exact: 0, "fuzzy-prefix": 0, override: 0 };
for (const entry of result.matchLog) {
  byMethod[entry.method] = (byMethod[entry.method] ?? 0) + 1;
}
const matchedSchoolCount = result.matchLog.length;
const totalStorsthlmSchools = result.storsthlmSchoolCount;

// --- How many gymnasium.json entries ended up with admission data ---
const gymnasiumIdsWithData = new Set();
for (const entry of result.matchLog) {
  for (const id of entry.matchedGymnasiumIds) gymnasiumIdsWithData.add(id);
}

// --- Cutoff vs median-only breakdown, + the zero-cutoff sanity check ---
let realCutoffCount = 0;
let medianOnlyCount = 0;
let zeroCutoffViolations = 0;
for (const id of gymnasiumIdsWithData) {
  const data = getRegionalDataForGymnasiumId(id);
  const admission = data.admission;
  if (!admission) continue;
  if (admission.avgCutoff === 0 || admission.maxCutoff === 0) {
    zeroCutoffViolations++;
    fail(
      `gymnasium id ${id} (${admission.sourceSchoolName}, ${admission.sourceKommun}) has a cutoff of exactly 0 -- ` +
        `this must never happen (0 in the source means "no cutoff", not "cutoff of 0 points").`
    );
  }
  if (admission.avgCutoff !== null) {
    realCutoffCount++;
  } else {
    medianOnlyCount++;
  }
}

// --- Sanity: every school outside Storsthlm kommuner must be untouched ---
const storsthlmKommuner = new Set(result.matchLog.map((e) => e.storsthlmKommun.toLowerCase()));
let outsideRegionWithData = 0;
for (const s of afterSchools) {
  if (!storsthlmKommuner.has(s.municipality.toLowerCase())) {
    const data = getRegionalDataForGymnasiumId(s.id);
    if (data.admission !== null) outsideRegionWithData++;
  }
}
if (outsideRegionWithData > 0) {
  fail(`${outsideRegionWithData} schools outside the matched Storsthlm kommuner have non-null admission data.`);
}

if (!rankingUnchanged) {
  fail("getAllGymnasiumSchools() output changed after the regional join ran -- the layer is not purely additive.");
}

// --- Report ---
console.log("=== Storsthlm regional admission join -- verification ===\n");
console.log(`Storsthlm schools (distinct school+kommun pairs): ${totalStorsthlmSchools}`);
console.log(
  `Matched: ${matchedSchoolCount}/${totalStorsthlmSchools} ` +
    `(exact: ${byMethod.exact}, fuzzy-prefix: ${byMethod["fuzzy-prefix"]}, override: ${byMethod.override})`
);
console.log(`Unmatched: ${result.unmatched.length}/${totalStorsthlmSchools}`);
console.log(`\ngymnasium.json entries with admission data attached: ${gymnasiumIdsWithData.size}`);
console.log(`  -- with a real (non-zero) cutoff:  ${realCutoffCount}`);
console.log(`  -- median-only (no program filled): ${medianOnlyCount}`);

console.log(`\n--- Unmatched Storsthlm schools (${result.unmatched.length}) ---`);
for (const u of [...result.unmatched].sort((a, b) => a.kommun.localeCompare(b.kommun, "sv") || a.school.localeCompare(b.school, "sv"))) {
  console.log(`  ${u.kommun.padEnd(16)} ${u.school} (${u.programsTotal} program row${u.programsTotal === 1 ? "" : "s"})`);
}

console.log(`\n--- Campus/program splits (one Storsthlm school -> multiple gymnasium.json entries) ---`);
for (const entry of result.matchLog) {
  if (entry.matchedGymnasiumIds.length > 1) {
    console.log(`  ${entry.storsthlmKommun} / "${entry.storsthlmSchool}" -> ${entry.matchedGymnasiumIds.length} entries:`);
    for (const name of entry.matchedGymnasiumNames) console.log(`      - ${name}`);
  }
}

console.log(`\n--- Sanity checks ---`);
console.log(`  Zero-cutoff violations: ${zeroCutoffViolations} (must be 0)`);
console.log(`  Schools outside Storsthlm kommuner with non-null admission data: ${outsideRegionWithData} (must be 0)`);
console.log(
  `  National ranking (getAllGymnasiumSchools()) unchanged after join: ${rankingUnchanged} ` +
    `(same array identity: ${sameArrayIdentity})`
);

console.log(`\n--- Baseline check ---`);
const BASELINE_MIN_MATCHES = 139;
console.log(
  `  Match count ${matchedSchoolCount} vs baseline floor ${BASELINE_MIN_MATCHES}: ` +
    (matchedSchoolCount >= BASELINE_MIN_MATCHES ? "OK (at or above baseline)" : "BELOW BASELINE -- investigate")
);
if (matchedSchoolCount < BASELINE_MIN_MATCHES) {
  fail(`Match count ${matchedSchoolCount} is below the ${BASELINE_MIN_MATCHES} baseline floor.`);
}

console.log(`\n${failed ? "RESULT: FAIL" : "RESULT: PASS"}`);
process.exit(failed ? 1 : 0);
