/**
 * Fetch SALSA data from Kolada API and match to existing school data.
 *
 * KPIs:
 *   U15416 - SALSA deviation (points above/below expected merit value)
 *   U15415 - Expected merit value (model-calculated)
 *
 * Run: node scripts/fetch-salsa.js
 */

const fs = require("fs");
const path = require("path");

const BASE = "http://api.kolada.se/v3";
const YEAR = 2024;
const PER_PAGE = 1000;

// -- helpers --

async function fetchAllPages(url) {
  const results = [];
  let page = 1;
  while (true) {
    const sep = url.includes("?") ? "&" : "?";
    const full = `${url}${sep}page=${page}&per_page=${PER_PAGE}`;
    console.log(`  GET ${full}`);
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

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/,.*$/, "") // drop trailing comma clauses like ", gr"
    .replace(/\s+/g, " ")
    .trim();
}

// More aggressive normalization for fuzzy matching
function normalizeAggressive(name) {
  return name
    .toLowerCase()
    .replace(/,.*$/, "")
    .replace(/[^a-zåäöéü0-9]/g, "")
    .trim();
}

// -- main --

async function main() {
  console.log("=== Fetching SALSA data from Kolada API ===\n");

  // 1. Fetch SALSA deviation (U15416) for all schools, year 2024
  console.log(`1. Fetching SALSA deviation (U15416) for ${YEAR}...`);
  const deviationRaw = await fetchAllPages(`${BASE}/oudata/kpi/U15416/year/${YEAR}`);
  console.log(`   Got ${deviationRaw.length} entries\n`);

  // 2. Fetch expected merit value (U15415) for all schools, year 2024
  console.log(`2. Fetching expected merit value (U15415) for ${YEAR}...`);
  const expectedRaw = await fetchAllPages(`${BASE}/oudata/kpi/U15415/year/${YEAR}`);
  console.log(`   Got ${expectedRaw.length} entries\n`);

  // Build maps: ou_id -> value (only gender=T, non-null)
  const deviationMap = new Map();
  for (const entry of deviationRaw) {
    const val = entry.values?.find((v) => v.gender === "T" && v.value !== null && v.status !== "Missing");
    if (val) deviationMap.set(entry.ou, val.value);
  }
  console.log(`   Deviation values (non-null): ${deviationMap.size}`);

  const expectedMap = new Map();
  for (const entry of expectedRaw) {
    const val = entry.values?.find((v) => v.gender === "T" && v.value !== null && v.status !== "Missing");
    if (val) expectedMap.set(entry.ou, val.value);
  }
  console.log(`   Expected values (non-null): ${expectedMap.size}\n`);

  // 3. Fetch all school OUs from Kolada (we need names to match)
  //    Only V15E* are grundskola units
  console.log("3. Fetching all municipalities...");
  const muniRes = await fetch(`${BASE}/municipality`);
  const muniJson = await muniRes.json();
  const municipalities = muniJson.values || [];
  console.log(`   Got ${municipalities.length} municipalities\n`);

  // Collect all OU IDs that have SALSA data
  const allOuIds = new Set([...deviationMap.keys(), ...expectedMap.keys()]);
  console.log(`   Total unique OUs with SALSA data: ${allOuIds.size}`);

  // Fetch OU details in batches (by municipality to be efficient)
  console.log("4. Fetching OU details for schools with SALSA data...");
  const ouMap = new Map(); // ou_id -> { id, title, municipality }

  // Fetch all V15E OUs (schools) -- we can query by title prefix or just get all
  // The most efficient way: query OUs for each municipality that appears in our data
  // But since OU IDs encode municipality, we can extract municipality codes
  const muniCodes = new Set();
  for (const ouId of allOuIds) {
    // V15E0114... -> municipality code is embedded after V15E
    // Format: V15EMMMMXXXXX where MMMM is municipality code
    const match = ouId.match(/^V15E(\d{4})/);
    if (match) muniCodes.add(match[1]);
  }
  console.log(`   Found ${muniCodes.size} municipalities with school SALSA data`);

  // Fetch OUs per municipality
  let fetchedOus = 0;
  for (const code of muniCodes) {
    const ous = await fetchAllPages(`${BASE}/ou?municipality=${code}`);
    for (const ou of ous) {
      if (allOuIds.has(ou.id)) {
        ouMap.set(ou.id, { id: ou.id, title: ou.title, municipality: ou.municipality });
        fetchedOus++;
      }
    }
  }
  console.log(`   Matched ${fetchedOus} OUs with names\n`);

  // 4. Read existing school data from CSV
  console.log("5. Reading existing school CSV...");
  const csvPath = path.join(__dirname, "..", "data", "schools_with_coordinates.csv");
  const csvRaw = fs.readFileSync(csvPath, "utf-8");
  const csvLines = csvRaw.trim().split("\n");

  const csvSchools = [];
  for (let i = 1; i < csvLines.length; i++) {
    // Handle quoted fields (some school names contain commas)
    const line = csvLines[i];
    const cols = [];
    let inQuote = false;
    let current = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cols.push(current); current = ""; continue; }
      current += ch;
    }
    cols.push(current);

    if (cols.length < 8) continue;
    csvSchools.push({
      id: cols[0],
      name: cols[1],
      municipality: cols[2],
      meritValue: parseFloat(cols[4]),
    });
  }
  console.log(`   Read ${csvSchools.length} schools from CSV\n`);

  // 5. Match Kolada OUs to CSV schools by normalized name + municipality
  console.log("6. Matching SALSA data to existing schools...");

  // Build municipality code -> name map
  const muniCodeToName = new Map();
  for (const m of municipalities) {
    muniCodeToName.set(m.id, m.title);
  }

  // Build lookup: "normalized_name|municipality_name" -> csv school
  const csvLookup = new Map();
  const csvLookupAggressive = new Map();
  for (const s of csvSchools) {
    const key = `${normalize(s.name)}|${normalize(s.municipality)}`;
    csvLookup.set(key, s);
    const keyAgg = `${normalizeAggressive(s.name)}|${normalizeAggressive(s.municipality)}`;
    csvLookupAggressive.set(keyAgg, s);
  }

  const salsaData = {};
  let matched = 0;
  let unmatched = 0;
  const unmatchedNames = [];

  for (const [ouId, ou] of ouMap) {
    const deviation = deviationMap.get(ouId);
    const expected = expectedMap.get(ouId);
    if (deviation === undefined && expected === undefined) continue;

    const muniName = muniCodeToName.get(ou.municipality) || "";
    const key = `${normalize(ou.title)}|${normalize(muniName)}`;
    const keyAgg = `${normalizeAggressive(ou.title)}|${normalizeAggressive(muniName)}`;

    let csvSchool = csvLookup.get(key) || csvLookupAggressive.get(keyAgg);

    // Try without municipality for unique names
    if (!csvSchool) {
      const nameNorm = normalize(ou.title);
      const candidates = csvSchools.filter((s) => normalize(s.name) === nameNorm);
      if (candidates.length === 1) csvSchool = candidates[0];
    }

    // Try aggressive match without municipality
    if (!csvSchool) {
      const nameAgg = normalizeAggressive(ou.title);
      const candidates = csvSchools.filter((s) => normalizeAggressive(s.name) === nameAgg);
      if (candidates.length === 1) csvSchool = candidates[0];
    }

    if (csvSchool) {
      salsaData[csvSchool.id] = {
        deviation: deviation !== undefined ? Math.round(deviation * 10) / 10 : null,
        expected: expected !== undefined ? Math.round(expected * 10) / 10 : null,
        koladaOu: ouId,
        year: YEAR,
      };
      matched++;
    } else {
      unmatched++;
      if (unmatchedNames.length < 20) {
        unmatchedNames.push(`${ou.title} (${muniName}, ${ouId})`);
      }
    }
  }

  console.log(`   Matched: ${matched}`);
  console.log(`   Unmatched: ${unmatched}`);
  if (unmatchedNames.length > 0) {
    console.log(`   Sample unmatched (first ${unmatchedNames.length}):`);
    for (const n of unmatchedNames) console.log(`     - ${n}`);
  }
  console.log();

  // 6. Save to JSON
  const outPath = path.join(__dirname, "..", "data", "salsa.json");
  fs.writeFileSync(outPath, JSON.stringify(salsaData, null, 2), "utf-8");
  console.log(`Saved ${Object.keys(salsaData).length} SALSA entries to ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
