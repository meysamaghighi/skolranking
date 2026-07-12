/**
 * Fetch per-school gymnasium (upper secondary) statistics from Kolada API.
 *
 * Mirrors the pattern in fetch-salsa.js, but for gymnasieskolor (OU prefix
 * V17E) instead of grundskolor (V15E). No auth required -- Kolada v3 is a
 * fully open public API.
 *
 * KPIs (per-school / OU level, split by school type because Kolada tracks
 * kommunala and fristående gymnasieskolor as separate series for the same OU):
 *   N17690 - Genomsnittlig betygspoäng, gymnasieelever med examen, fristående skolor
 *   N17691 - Genomsnittlig betygspoäng, gymnasieelever med examen, kommunala skolor
 *   N17454 - Gymnasieelever med examen inom 3 år, fristående skolor, andel (%)
 *   N17451 - Gymnasieelever med examen inom 3 år, kommunala skolor, andel (%)
 *
 * Antagningspoäng (admission points) is NOT included: it is set regionally
 * per intake round with no clean national open-data source. Out of scope.
 *
 * Run: node scripts/fetch-gymnasium.js
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
// bounded concurrency. Kolada OU ids for gymnasium (V17E...) don't encode
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
      if (done % 100 === 0) console.log(`   ...${done}/${ids.length} OUs fetched`);
    }
  }

  await Promise.all(Array.from({ length: OU_CONCURRENCY }, worker));
  return ouMap;
}

async function main() {
  console.log("=== Fetching gymnasium (upper secondary school) data from Kolada API ===\n");

  console.log(`1. Fetching betygspoäng (fristående N17690, kommunala N17691) for ${YEAR}...`);
  const betygFri = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N17690/year/${YEAR}`));
  const betygKom = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N17691/year/${YEAR}`));
  console.log(`   fristående: ${betygFri.size}, kommunala: ${betygKom.size}\n`);

  console.log(`2. Fetching examensandel inom 3 år (fristående N17454, kommunala N17451) for ${YEAR}...`);
  const examFri = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N17454/year/${YEAR}`));
  const examKom = nonNullMap(await fetchAllPages(`${BASE}/oudata/kpi/N17451/year/${YEAR}`));
  console.log(`   fristående: ${examFri.size}, kommunala: ${examKom.size}\n`);

  // Union of every OU id that has at least one non-null metric.
  const allOuIds = new Set([...betygFri.keys(), ...betygKom.keys(), ...examFri.keys(), ...examKom.keys()]);
  console.log(`   Total unique gymnasieskolor with at least one metric: ${allOuIds.size}\n`);

  console.log("3. Fetching municipality names...");
  const muniRes = await fetch(`${BASE}/municipality`);
  const muniJson = await muniRes.json();
  const muniCodeToName = new Map(muniJson.values.map((m) => [m.id, m.title]));
  console.log(`   Got ${muniCodeToName.size} municipalities\n`);

  console.log(`4. Fetching OU (school) details for ${allOuIds.size} schools (this takes a few minutes)...`);
  const ouMap = await fetchOuDetails(allOuIds);
  console.log(`   Resolved ${ouMap.size}/${allOuIds.size} school names\n`);

  console.log("5. Building school records...");
  const schools = [];
  for (const ouId of allOuIds) {
    const ou = ouMap.get(ouId);
    if (!ou || !ou.title) continue;

    const isKommunal = betygKom.has(ouId) || examKom.has(ouId);
    const isFristaende = betygFri.has(ouId) || examFri.has(ouId);
    const schoolType = isKommunal && !isFristaende ? "Kommunal" : isFristaende && !isKommunal ? "Enskild" : "Kommunal";

    const meritPoints = betygKom.get(ouId) ?? betygFri.get(ouId) ?? null;
    const graduationRate = examKom.get(ouId) ?? examFri.get(ouId) ?? null;
    if (meritPoints === null && graduationRate === null) continue;

    const municipality = muniCodeToName.get(ou.municipality) || "";
    if (!municipality) continue;

    schools.push({
      id: ouId,
      name: ou.title,
      municipality,
      municipalitySlug: muniSlug(municipality),
      schoolType,
      meritPoints: meritPoints !== null ? Math.round(meritPoints * 10) / 10 : null,
      graduationRate: graduationRate !== null ? Math.round(graduationRate * 10) / 10 : null,
      slug: slugify(ou.title, ouId),
      year: YEAR,
    });
  }

  console.log(`   Built ${schools.length} school records\n`);

  const outPath = path.join(__dirname, "..", "data", "gymnasium.json");
  fs.writeFileSync(outPath, JSON.stringify(schools, null, 2), "utf-8");
  console.log(`Saved ${schools.length} gymnasium school records to ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
