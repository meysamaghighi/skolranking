/**
 * Fetch gymnasium admission-cutoff data (antagningsgränser) for the Storsthlm
 * region (~24-26 Stockholm-county kommuner) from gymnasieantagningen.storsthlm.se.
 *
 * This is a REGIONAL data source (Stockholm county only), unlike
 * fetch-gymnasium.js's national Kolada pull. It exists because
 * fetch-gymnasium.js explicitly punted on admission points: "set regionally
 * per intake round with no clean national open-data source." Storsthlm
 * publishes final-admission (slutantagning) results as a yearly Excel file,
 * but the download URL's media hash is NOT year-derivable -- it must be
 * scraped off the index page every run, never hardcoded.
 *
 * Parsing note: the .xlsx is parsed with ZERO new npm dependencies. An .xlsx
 * file is a zip archive; we read its central directory with node:zlib's
 * inflateRawSync (method 8 = deflate; method 0 = stored) to pull out
 * xl/worksheets/sheet1.xml (the single flat sheet, "1 - Hela regionen") and
 * xl/sharedStrings.xml, then parse those two XML files with regex (no XML
 * parser dependency either -- the shape is simple and stable). This avoids
 * adding `xlsx` (abandoned, CVE-carrying) or any other xlsx-parsing package
 * for what is a build-time script only.
 *
 * Source columns (row 1 is the header; "Organistionsform" is misspelled in
 * the source itself -- kept as-is so header matching stays exact):
 *   År | Kommun | Skola | Organistionsform | StudieVagKod | Studievag |
 *   Antagningsgrans | Median | AntalPlatser | AntalAntagna | AntalReserver |
 *   AntalLedigaPlatser
 * Columns are resolved by matching header text, not fixed letter positions,
 * so a future column insertion in the source file won't silently corrupt
 * this script's output.
 *
 * Data quirk (real, seen in the 2026 file): "Antagningsgrans" is stored as a
 * literal number when it's 0, but as a shared string for any non-zero value.
 * "Median" is stored as a shared string for every row, even when its value is
 * numeric -- and in other years a "Median"/"Antagningsgrans" cell can be a
 * non-numeric shared-string placeholder (e.g. a dash) when nothing was
 * reported for that program. Both fields are parsed defensively: a value
 * that doesn't parse as a finite number becomes `null` in the output --
 * never `0`, since 0 is itself a valid (if rare) real cutoff.
 *
 * Yearly refresh recipe: bump the YEAR constant below (or pass
 * STORSTHLM_YEAR=NNNN / a year as argv[2]) and re-run. No other changes
 * needed -- the index-page scrape re-discovers that year's file URL.
 *
 * Run: node scripts/fetch-storsthlm-admission.js
 *      STORSTHLM_YEAR=2025 node scripts/fetch-storsthlm-admission.js
 *      node scripts/fetch-storsthlm-admission.js 2025
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const INDEX_URL =
  "https://gymnasieantagningen.storsthlm.se/antagningsgranser-elevnojdhet/ladda-ned-antagningsstatistik/";
const YEAR = parseInt(process.env.STORSTHLM_YEAR || process.argv[2] || String(new Date().getFullYear()), 10);

const HEADER_NAMES = [
  "År",
  "Kommun",
  "Skola",
  "Organistionsform",
  "StudieVagKod",
  "Studievag",
  "Antagningsgrans",
  "Median",
  "AntalPlatser",
  "AntalAntagna",
  "AntalReserver",
  "AntalLedigaPlatser",
];

// -- HTML/XML entity decoding (hrefs use HTML entities like &#xE4; for "ä";
//    the XML text nodes inside the xlsx use the same numeric-entity family) --

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&"); // must run last
}

// -- Minimal zip reader (central-directory based) --

function readZip(buffer) {
  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Not a valid zip file: End Of Central Directory record not found");

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  const CD_SIG = 0x02014b50;
  const entries = new Map();
  let offset = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== CD_SIG) throw new Error(`Bad zip central-directory signature at byte ${offset} (entry ${i})`);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLen);
    entries.set(fileName, { method, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  function readEntry(name) {
    const meta = entries.get(name);
    if (!meta) throw new Error(`Zip entry not found: ${name} (have: ${Array.from(entries.keys()).join(", ")})`);
    const LFH_SIG = 0x04034b50;
    const lh = meta.localHeaderOffset;
    if (buffer.readUInt32LE(lh) !== LFH_SIG) throw new Error(`Bad local file header for ${name} at byte ${lh}`);
    const lFileNameLen = buffer.readUInt16LE(lh + 26);
    const lExtraLen = buffer.readUInt16LE(lh + 28);
    const dataStart = lh + 30 + lFileNameLen + lExtraLen;
    const compressed = buffer.subarray(dataStart, dataStart + meta.compressedSize);
    if (meta.method === 0) return Buffer.from(compressed); // stored
    if (meta.method === 8) return zlib.inflateRawSync(compressed); // deflated
    throw new Error(`Unsupported zip compression method ${meta.method} for ${name}`);
  }

  return { names: () => Array.from(entries.keys()), readEntry };
}

// -- xlsx XML parsing (sharedStrings.xml + worksheets/sheet1.xml) --

function parseSharedStrings(xml) {
  const strings = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const text = Array.from(m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g))
      .map((t) => t[1])
      .join("");
    strings.push(decodeEntities(text));
  }
  return strings;
}

function parseRows(sheetXml) {
  return sheetXml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
}

// Returns { colLetter: { isShared, raw } } for every <c> present in the row
// (rows are sparse -- a column with no value simply has no <c> entry).
function parseRowCells(rowXml) {
  const cells = {};
  const cellRe = /<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let m;
  while ((m = cellRe.exec(rowXml))) {
    const [, col, attrs, inner] = m;
    const isShared = /(^|\s)t="s"/.test(attrs);
    let raw = null;
    if (inner) {
      const vm = inner.match(/<v>([\s\S]*?)<\/v>/);
      if (vm) raw = vm[1];
    }
    cells[col] = { isShared, raw };
  }
  return cells;
}

function resolveCell(cell, sharedStrings) {
  if (!cell || cell.raw === null || cell.raw === undefined) return null;
  return cell.isShared ? sharedStrings[parseInt(cell.raw, 10)] ?? null : cell.raw;
}

// -- Index-page scraping for the current year's Excel link --

async function findExcelUrl(year) {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching index page ${INDEX_URL}`);
  const html = await res.text();

  const hrefRe = /href="([^"]+)"/gi;
  const candidates = [];
  let m;
  while ((m = hrefRe.exec(html))) {
    const decoded = decodeEntities(m[1]);
    if (!/\.xlsx$/i.test(decoded)) continue;
    if (!/slutantagning/i.test(decoded)) continue; // e.g. "slutantagningsresultat", "slutantagning-"
    if (/prelimin/i.test(decoded)) continue; // exclude preliminärantagning files
    if (!decoded.includes(String(year))) continue;
    candidates.push(decoded);
  }

  const unique = Array.from(new Set(candidates.map((c) => new URL(c, INDEX_URL).toString())));
  if (unique.length === 0) {
    throw new Error(
      `No slutantagning Excel link found for year ${year} on ${INDEX_URL}. ` +
        `Either the page structure changed or ${year}'s final-admission file isn't published yet -- ` +
        `not falling back to another year.`
    );
  }
  if (unique.length > 1) {
    console.warn(
      `   Warning: found ${unique.length} candidate links for ${year}, using the first:\n   ${unique.join("\n   ")}`
    );
  }
  return unique[0];
}

async function main() {
  console.log("=== Fetching Storsthlm gymnasium admission cutoffs ===\n");

  console.log(`1. Scraping index page for the ${YEAR} slutantagning Excel link...`);
  console.log(`   ${INDEX_URL}`);
  const xlsxUrl = await findExcelUrl(YEAR);
  console.log(`   Found: ${xlsxUrl}\n`);

  console.log("2. Downloading Excel file...");
  const xlsxRes = await fetch(xlsxUrl);
  if (!xlsxRes.ok) throw new Error(`HTTP ${xlsxRes.status} downloading ${xlsxUrl}`);
  const buffer = Buffer.from(await xlsxRes.arrayBuffer());
  console.log(`   Downloaded ${buffer.length} bytes\n`);

  console.log("3. Unzipping and parsing worksheet...");
  const zip = readZip(buffer);
  const sharedStrings = parseSharedStrings(zip.readEntry("xl/sharedStrings.xml").toString("utf8"));
  const sheetXml = zip.readEntry("xl/worksheets/sheet1.xml").toString("utf8");
  const rows = parseRows(sheetXml);
  console.log(
    `   ${zip.names().length} zip entries, sheet XML ${sheetXml.length} bytes, ${rows.length} <row> elements, ${sharedStrings.length} shared strings\n`
  );
  if (rows.length < 2) throw new Error("Worksheet has no data rows (expected a header row + data rows)");

  console.log("4. Resolving header columns...");
  const headerCells = parseRowCells(rows[0]);
  const colByHeader = {};
  for (const [col, cell] of Object.entries(headerCells)) {
    const text = resolveCell(cell, sharedStrings);
    if (text) colByHeader[text.trim()] = col;
  }
  const missing = HEADER_NAMES.filter((h) => !colByHeader[h]);
  if (missing.length > 0) {
    throw new Error(
      `Expected header(s) not found in row 1: ${missing.join(", ")}. ` +
        `Got headers: ${Object.keys(colByHeader).join(", ")}`
    );
  }
  console.log(`   Resolved all ${HEADER_NAMES.length} expected headers\n`);

  console.log("5. Building records...");
  const records = [];
  let skipped = 0;
  for (const rowXml of rows.slice(1)) {
    const cells = parseRowCells(rowXml);
    const get = (header) => resolveCell(cells[colByHeader[header]], sharedStrings);
    const getInt = (header) => {
      const v = get(header);
      if (v === null || v === "") return null;
      const n = parseInt(v, 10);
      return Number.isNaN(n) ? null : n;
    };
    const getFloat = (header) => {
      const v = get(header);
      if (v === null || v === "") return null;
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null; // dash/placeholder strings -> null, never 0
    };
    const getStr = (header) => {
      const v = get(header);
      return v === null ? null : String(v).trim();
    };

    const kommun = getStr("Kommun");
    const school = getStr("Skola");
    if (!kommun || !school) {
      skipped++;
      continue;
    }

    records.push({
      year: getInt("År"),
      kommun,
      school,
      organisationsform: getStr("Organistionsform"), // "K" kommunal / "F" fristående, source's own spelling
      programCode: getStr("StudieVagKod"),
      program: getStr("Studievag"),
      antagningsgrans: getFloat("Antagningsgrans"),
      median: getFloat("Median"),
      platser: getInt("AntalPlatser"),
      antagna: getInt("AntalAntagna"),
      reserver: getInt("AntalReserver"),
      lediga: getInt("AntalLedigaPlatser"),
    });
  }
  console.log(`   Parsed ${records.length} records (${skipped} rows skipped -- missing kommun/school)\n`);

  const nullAntagningsgrans = records.filter((r) => r.antagningsgrans === null).length;
  const nullMedian = records.filter((r) => r.median === null).length;
  console.log(`   ${nullAntagningsgrans} records with null antagningsgrans, ${nullMedian} with null median\n`);

  const output = {
    meta: {
      source: INDEX_URL,
      xlsxUrl,
      year: YEAR,
      fetchedAt: new Date().toISOString(),
      rowCount: records.length,
    },
    records,
  };

  const outPath = path.join(__dirname, "..", "data", "storsthlm-admission.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Saved ${records.length} records to ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
