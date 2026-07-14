/**
 * Fetch per-unit förskola (preschool) statistics from Kolada API.
 *
 * Mirrors the pattern in fetch-gymnasium.js, but for förskola (OU prefix
 * V11E) instead of gymnasieskolor (V17E). No auth required -- Kolada v3 is
 * a fully open public API.
 *
 * IMPORTANT CONTEXT: earlier research (2026-03-17) concluded Kolada only
 * exposes förskola indicators at KOMMUN level. That was wrong for a subset
 * of KPIs -- most of Kolada's 188 förskola indicators ARE kommun-only, but
 * three staffing-quality KPIs are also published at the individual OU
 * (per-förskola) level via /oudata, covering ~8,000-8,500 of Sweden's
 * ~9,700 förskolor. Verified today by probing /oudata/kpi/{id}/year/{y}
 * directly (does NOT show up via /kpi?title= search, which only surfaces
 * kommun-level metadata).
 *
 * There is no meritvärde-equivalent single outcome metric for förskola
 * (no exams, no grades) -- these KPIs measure staffing quality/inputs, not
 * outcomes. That is the honest, defensible ranking basis available.
 *
 * KPIs (per-unit / OU level, "lägeskommun" variant = blended across
 * driftsform, i.e. covers both kommunala and fristående/enskilda förskolor
 * at that address):
 *   N11811 - Förskollärartäthet: antal barn per lärare med förskollärarlegitimation
 *            (children per certified preschool teacher). PRIMARY ranking metric
 *            -- lower is better. Coverage 2025: 8,085 / 8,541 non-null.
 *   N11808 - Heltidstjänster i förskolan med förskollärarlegitimation, andel (%)
 *            (share of full-time staff holding a teaching certificate).
 *            Higher is better. Coverage 2025: 8,230 / 8,541 non-null.
 *   N11102 - Inskrivna barn per årsarbetare i förskolan, antal
 *            (children per staff member, all staff incl. uncertified).
 *            Lower is better. Coverage 2025: 8,252 / 8,541 non-null.
 *
 * Barn per barngrupp (N11702, group size) was considered but dropped: only
 * ~30% of units report it (2,538 / 8,351 in 2024), too sparse for a
 * national ranking.
 *
 * Run: node scripts/fetch-forskola.js
 */

const fs = require("fs");
const path = require("path");

const BASE = "https://api.kolada.se/v3";
const YEAR = 2025;
const PER_PAGE = 1000;
const OU_CONCURRENCY = 25;

async function fetchAllPages(url) {
  const results = [];
  let page = 1;
  while (true) {
    const sep = url.includes("?") ? "&" : "?";
    const full = `${url}${sep}page=${page}&per_page=${PER_PAGE}`;
    const res = await fetch(full);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${full}`);
    const json = await res.json();
    const vals = json.values || [];
    if (vals.length === 0) break;
    results.push(...vals);
    if (vals.length < PER_PAGE) break; // last page
    page++;
  }
  return results;
}

function nonNullMap(entries) {
  const map = new Map();
  for (const entry of entries) {
    const val = entry.values?.find((v) => v.gender === "T" && v.value !== null && v.status !== "Missing");
    if (val) map.set(entry.ou, val.value);
  }
  return map;
}

function slugify(name, id) {
  const base = name
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/é/g, "e").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

function muniSlug(name) {
  return name
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/é/g, "e").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Fetch OU details (name + municipality code) for a list of ou ids, with
// bounded concurrency. Kolada OU ids for förskola (V11E...) don't encode
// the municipality code the way grundskola (V15E<muni>...) ids do, so we
// look each one up individually via GET /ou/{id}.
async function fetchOuDetails(ouIds) {
  const ids = Array.from(ouIds);
  const ouMap = new Map();
  let i = 0;
  let done = 0;

  async function worker() {
    while (i < ids.length) {
      const idx = i++;
      const id = ids[idx];
      try {
        const res = await fetch(`${BASE}/ou/${id}`);
        if (res.ok) {
          const json = await res.json();
          const v = json.values?.[0];
          if (v) ouMap.set(id, { id: v.id, title: v.title, municipality: v.municipality });
        }
      } catch (e) {
        console.warn(`   Failed to fetch OU ${id}: ${e.message}`);
      }
      done++;
      if (done % 500 === 0) console.log(`   ...${done}/${ids.length} OUs fetched`);
    }
  }

  await Promise.all(Array.from({ length: OU_CONCURRENCY }, worker));
  return ouMap;
}

async function main() {
  console.log("=== Fetching förskola (preschool) data from Kolada API ===\n");

  console.log(`1. Fetching förskollärartäthet (N11811, barn/lärare med legitimation) for ${YEAR}...`);
  const teacherDensity = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N11811/year/${YEAR}`));
  console.log(`   ${teacherDensity.size} units\n`);

  console.log(`2. Fetching andel legitimerad personal (N11808, %) for ${YEAR}...`);
  const certifiedShare = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N11808/year/${YEAR}`));
  console.log(`   ${certifiedShare.size} units\n`);

  console.log(`3. Fetching barn per årsarbetare, alla (N11102, antal) for ${YEAR}...`);
  const childrenPerStaff = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N11102/year/${YEAR}`));
  console.log(`   ${childrenPerStaff.size} units\n`);

  // Ranking is by teacherDensity (N11811). Union with the other two only to
  // decide which OUs are worth a name lookup; units lacking the primary
  // metric are dropped later since there's nothing to rank them by.
  const allOuIds = new Set([...teacherDensity.keys(), ...certifiedShare.keys(), ...childrenPerStaff.keys()]);
  console.log(`   Total unique förskolor with at least one metric: ${allOuIds.size}\n`);

  console.log("4. Fetching municipality names...");
  const muniRes = await fetch(`${BASE}/municipality`);
  const muniJson = await muniRes.json();
  const muniCodeToName = new Map(muniJson.values.map((m) => [m.id, m.title]));
  console.log(`   Got ${muniCodeToName.size} municipalities\n`);

  console.log(`5. Fetching OU (unit) details for ${allOuIds.size} förskolor (this takes several minutes)...`);
  const ouMap = await fetchOuDetails(allOuIds);
  console.log(`   Resolved ${ouMap.size}/${allOuIds.size} unit names\n`);

  console.log("6. Building förskola records...");
  const units = [];
  for (const ouId of allOuIds) {
    const ou = ouMap.get(ouId);
    if (!ou || !ou.title) continue;

    const density = teacherDensity.get(ouId) ?? null;
    if (density === null) continue; // no primary ranking metric

    const municipality = muniCodeToName.get(ou.municipality) || "";
    if (!municipality) continue;

    units.push({
      id: ouId,
      // A handful of registry names carry a trailing school-unit code;
      // strip long digit runs defensively (mirrors gymnasium cleanup).
      name: ou.title.replace(/\s+\d{6,}$/, ""),
      municipality,
      municipalitySlug: muniSlug(municipality),
      childrenPerTeacher: Math.round(density * 10) / 10,
      certifiedShare: certifiedShare.has(ouId) ? Math.round(certifiedShare.get(ouId) * 10) / 10 : null,
      childrenPerStaff: childrenPerStaff.has(ouId) ? Math.round(childrenPerStaff.get(ouId) * 10) / 10 : null,
      slug: slugify(ou.title, ouId),
      year: YEAR,
    });
  }

  console.log(`   Built ${units.length} förskola records\n`);

  const outPath = path.join(__dirname, "..", "data", "forskola.json");
  fs.writeFileSync(outPath, JSON.stringify(units, null, 2), "utf-8");
  console.log(`Saved ${units.length} förskola records to ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
