import fs from "fs";
import path from "path";
import { getAllGymnasiumSchools } from "./gymnasium";

/**
 * Regional enrichment layer for gymnasium schools -- v2 task 4 of
 * `agent/decisions/2026-07-29-skolranking-gymnasium-ranking-v2.md` in the
 * indie-launcher repo.
 *
 * Joins Storsthlm's regional admission-cutoff data (`data/storsthlm-admission.json`,
 * ~24 Stockholm-county kommuner, from `scripts/fetch-storsthlm-admission.js`,
 * v2 task 2) onto the national gymnasium dataset (`data/gymnasium.json`,
 * `app/lib/gymnasium.ts`, v2 task 1) by (normalized name, kommun) matching.
 *
 * SCOPE: data/join layer only, no UI. `/gymnasium` pages are v2 task 5, a
 * separate later task -- this module is dead code from the app's point of
 * view until something imports it.
 *
 * elevnojdhet (pupil-satisfaction survey, v2 task 3) is DELIBERATELY NOT
 * INCLUDED: task 3's scraper is blocked (no data file exists yet). The
 * `RegionalData.elevnojdhet` field below is a typed placeholder, always
 * `null`, so a future task can populate it without reshaping this module's
 * public API or its consumers.
 *
 * HARD RULES (do not relax without re-reading the spec):
 *  1. `antagningsgrans: 0` in the source data means "no cutoff" (the
 *     program did not fill -- everyone who qualified was admitted), NOT
 *     "cutoff of 0 points". It is excluded from every cutoff aggregate.
 *     `avgCutoff`/`maxCutoff` are `null`, never `0`, when no program at a
 *     school had a real cutoff.
 *  2. This layer is purely additive. It never mutates the array returned by
 *     `getAllGymnasiumSchools()` (a memoized singleton shared by every other
 *     consumer) and never touches `rankingScore`/`rank`. Schools outside the
 *     Storsthlm kommuner, or without a confident name match, simply get
 *     `null` back -- no error, no penalty, no change in behavior from
 *     before this module existed.
 *  3. A wrong join (school A's admission points shown under school B's
 *     name) is strictly worse than no join. When matching is ambiguous the
 *     code below leaves the school unmatched rather than guessing.
 */

// ---------------------------------------------------------------------------
// Source data shapes
// ---------------------------------------------------------------------------

interface StorsthlmRecord {
  year: number;
  kommun: string;
  school: string;
  organisationsform: string;
  programCode: string;
  program: string;
  antagningsgrans: number | null;
  median: number | null;
  platser: number;
  antagna: number;
  reserver: number;
  lediga: number;
}

interface StorsthlmFile {
  meta: { source: string; xlsxUrl: string; year: number; fetchedAt: string; rowCount: number };
  records: StorsthlmRecord[];
}

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface RegionalAdmissionSummary {
  /**
   * Mean `antagningsgrans` across this school's programs that actually had
   * a real (non-zero) cutoff. `null` if none did (every program either had
   * no reported cutoff data, or admitted everyone who qualified).
   */
  avgCutoff: number | null;
  /** The single highest `antagningsgrans` among this school's programs --
   * its most selective program. Same null rule as `avgCutoff`. */
  maxCutoff: number | null;
  /**
   * Mean `median` (median admitted student's meritvärde) across all
   * programs that reported one -- including programs with `antagningsgrans:
   * 0`. `median` reflects what admitted students actually scored even when
   * the program didn't fill, so it stays meaningful there; it is a
   * different, softer signal than `avgCutoff` and is surfaced separately
   * rather than folded together, per the spec's instruction to decide (and
   * document) which of the two fields to expose.
   */
  avgMedian: number | null;
  /** How many programs had a real (non-zero) cutoff, out of how many total
   * programs this school had rows for in the source data. */
  programsWithCutoff: number;
  programsTotal: number;
  year: number;
  /** Raw Storsthlm kommun + school name this summary was built from, kept
   * for audit/debugging -- not meant for display as-is. */
  sourceKommun: string;
  sourceSchoolName: string;
}

export interface RegionalData {
  admission: RegionalAdmissionSummary | null;
  /** Pupil-satisfaction survey (Helhetsomdöme %, v2 task 3). Typed as
   * `number | null` so the v2-task-5 UI can render it the moment task 3's
   * scraper lands, with no further shape/consumer changes. The join layer
   * below always sets this to `null` today -- task 3's data file doesn't
   * exist yet (see module doc comment) -- so in practice this field is
   * unpopulated across the whole site until that task ships. */
  elevnojdhet: number | null;
}

export type MatchMethod = "exact" | "fuzzy-prefix" | "override";

export interface MatchLogEntry {
  storsthlmSchool: string;
  storsthlmKommun: string;
  method: MatchMethod;
  /** gymnasium.json ids this Storsthlm school's admission summary was
   * attached to. Length > 1 means a single Storsthlm school was matched to
   * several national dataset entries (a campus/program split -- see
   * `matchGymnasiumCandidates` doc comment for the policy). */
  matchedGymnasiumIds: string[];
  matchedGymnasiumNames: string[];
  programsTotal: number;
}

export interface UnmatchedEntry {
  school: string;
  kommun: string;
  programsTotal: number;
}

export interface RegionalJoinResult {
  /** gymnasium.json id -> RegionalData. Only ids with a real match are
   * present; absent ids simply have no regional data (query via
   * `getRegionalDataForGymnasiumId`, which returns the all-null shape). */
  byGymnasiumId: Map<string, RegionalData>;
  matchLog: MatchLogEntry[];
  unmatched: UnmatchedEntry[];
  /** Count of distinct (school, kommun) pairs in the Storsthlm source. */
  storsthlmSchoolCount: number;
}

// ---------------------------------------------------------------------------
// Manual override table
// ---------------------------------------------------------------------------

/**
 * (Storsthlm school name, Storsthlm kommun) -> gymnasium.json id(s).
 *
 * Seeded ONLY with pairs verified by reading both names side by side (see
 * the v2-task-4 implementation notes for the reasoning on each) -- not
 * padded with guesses. Every entry here failed BOTH the exact-normalized
 * and fuzzy-prefix matchers below, usually because of a word-order swap
 * ("Idrottsgymnasiet Nacka" vs "Nacka Idrottsgymnasium"), an abbreviation
 * one source uses and the other doesn't ("Sthlm" vs "Stockholms",
 * "Gymnasiet" vs "Gymn."/"gym"/"gy."), or a fused compound word
 * ("Servicegymnasiet" vs "Service Gymnasiet"). Each target school name is
 * unique within its kommun in gymnasium.json, so there is no plausible
 * alternative candidate being displaced.
 *
 * Cases deliberately NOT added despite being *tempting*:
 *  - "Amerikanska Gymnasiet Campus Frescati Hage" / "...Stora Essingen"
 *    (Stockholm) -- gymnasium.json has only one undifferentiated
 *    "Amerikanska Gymnasiet Stockholm" entry, and it's not possible to
 *    tell which (if either) of the two Storsthlm campuses it represents.
 *    Attaching either campus's cutoff to it risks publishing the wrong
 *    program's points, so both stay unmatched.
 *  - "Drottning Blankas Gy Odenplan (fd Cybergymnasiet)" -> a plausible
 *    read is gymnasium.json's "Cybergymnasiet Stockholm", but there's no
 *    way to confirm it's the *same campus* the Storsthlm row describes
 *    rather than a different former Cybergymnasiet site. Left unmatched.
 *  - "Viktor Rydberg Gy Campus(fd Jarlaplan/Odenplan)" -> gymnasium.json
 *    still lists "Viktor Rydberg gy. Jarlaplan" and "...Odenplan" as two
 *    separate entries; whether the 2025 national dataset's split reflects
 *    the same merge the Storsthlm name implies isn't verifiable from the
 *    text alone. Left unmatched rather than guessing which (or both).
 *
 * Refresh recipe for next year: if `storsthlmSchoolCount - matched` grows,
 * re-run `scripts/verify-regional-join.mjs`, read its unmatched list, and
 * add verified entries here the same way -- don't loosen the automatic
 * matcher's thresholds to chase a bigger number.
 */
export const MANUAL_OVERRIDES: ReadonlyArray<{
  school: string;
  kommun: string;
  gymnasiumIds: string[];
}> = [
  { school: "Täby yrkesgymnasium", kommun: "Täby", gymnasiumIds: ["V17E10373112"] }, // "Yrkesgymnasiet  Täby" -- word order swap
  { school: "Väsby Yrkesgymnasium", kommun: "Upplands Väsby", gymnasiumIds: ["V17E54882637"] }, // "Yrkesgymnasiet  Väsby" -- same chain, same swap
  { school: "Idrottsgymnasiet Nacka", kommun: "Nacka", gymnasiumIds: ["V17E35265260"] }, // "Nacka Idrottsgymnasium" -- word order swap
  { school: "Örjanskolans gymnasium", kommun: "Södertälje", gymnasiumIds: ["V17E70543431"] }, // "Örjanskolan gym" -- genitive s + gymnasium/gym abbreviation
  { school: "Sigtunaskolan Humanistiska läroverket", kommun: "Sigtuna", gymnasiumIds: ["V17E45552626"] }, // "Sigtunaskolan hum. läroverket, gy" -- abbreviated
  { school: "Rör- och Elentreprenörernas Friskola (REFIS)", kommun: "Stockholm", gymnasiumIds: ["V17E79829846"] }, // "REFIS Rör- och Elentr. friskola Sthlm" -- unique REFIS acronym anchors it, word order + abbreviation swap
  { school: "Norra Reals gymnasium", kommun: "Stockholm", gymnasiumIds: ["V17E82964090"] }, // "Norra Real" -- genitive s
  { school: "Stockholms hotell- och restaurangskola", kommun: "Stockholm", gymnasiumIds: ["V17E30677562"] }, // "Sthlm hotell & restaurangsk" -- abbreviation
  { school: "Stockholms transport och fordonstekniska gymnasium", kommun: "Stockholm", gymnasiumIds: ["V17E85054102"] }, // "Sthlm Transport- och fordonstekniska gymnasiet" -- abbreviation
  { school: "Praktiska Gymnasiet Stockholm Liljeholmen", kommun: "Stockholm", gymnasiumIds: ["V17E38236800"] }, // "Praktiska Gymnasiet Liljeholmen" -- known chain, unique campus name, Storsthlm's name just also repeats the kommun
  { school: "ProCivitas Privata Gymnasium Stockholm Karlberg", kommun: "Solna", gymnasiumIds: ["V17E29733255"] }, // "ProCivitas Privata Gymnasium Karlberg" -- unique campus name, kommun matches
  { school: "Kungsholmens gymnasium/Stockholms musikgymnasium", kommun: "Stockholm", gymnasiumIds: ["V17E74812809"] }, // "Kungsh gy/Sthlms Musikgy" -- same slash-combo structure, abbreviated
  { school: "Lilla Akademiens musikgymnasium", kommun: "Stockholm", gymnasiumIds: ["V17E83374651"] }, // "Lilla Akademiens Musikgymn." -- unique name, abbreviated suffix
  { school: "Teknik och Service Gymnasiet", kommun: "Stockholm", gymnasiumIds: ["V17E18451445"] }, // "Teknik & Servicegymnasiet" -- unique, fused compound word
];

// ---------------------------------------------------------------------------
// Name normalization (shared matching logic)
// ---------------------------------------------------------------------------

// Words that are noise for matching purposes: generic gymnasium-type nouns
// that vary between "gymnasium"/"gymnasiet"/"gymnasieskola(n)"/"gy"/"skola(n)"
// depending on the source, plus low-information connector words that one
// source spells out ("och", "and", "i") and the other drops or renders as a
// symbol ("&", stripped as punctuation below). NOTE: `app/lib/gymnasium.ts`
// already strips a trailing numeric school-unit code from the NATIONAL
// dataset's names (`s.name.replace(/\s+\d{6,}$/, "")`) -- that cleaning is
// NOT duplicated here. This module always normalizes the already-cleaned
// `.name` field from `getAllGymnasiumSchools()`, never the raw JSON.
const NOISE_WORDS = new Set([
  "gymnasium",
  "gymnasiet",
  "gymnasieskola",
  "gymnasieskolan",
  "gy",
  "skola",
  "skolan",
  "och",
  "and",
  "i",
]);

function normalizeWords(name: string): string[] {
  const lowered = name.toLowerCase();
  const stripped = lowered.replace(/[^\w\såäö]/gu, " ");
  return stripped
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !NOISE_WORDS.has(w));
}

function normalize(name: string): string {
  return normalizeWords(name).join(" ");
}

function commonPrefixLength(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * True if the two word lists are in a prefix relationship at length L --
 * i.e. one list is *entirely* consumed by the shared prefix (not just a
 * partial overlap). This is what stops "Värmdö gymnasium" (normalizes to
 * the single word "värmdö") from being treated as a fuzzy match for every
 * other Värmdö-kommun school whose name happens to also start with
 * "värmdö" -- a real false positive seen while building this matcher.
 */
function isFullPrefixRelation(a: string[], b: string[], length: number): boolean {
  return length === a.length || length === b.length;
}

interface GymCandidate {
  id: string;
  name: string;
  words: string[];
}

/**
 * Given one Storsthlm school's normalized word list and the gymnasium.json
 * candidates in the same kommun, return the best fuzzy-prefix match(es).
 *
 * Policy on multiple equally-good candidates (the campus/program-split
 * case): gymnasium.json sometimes represents one real-world school as
 * several national-dataset entries (e.g. "Järfälla gymnasium Barkarby" +
 * "...Jakobsberg"; seven separate "Rudbeck <program>" entries in
 * Sollentuna). When several candidates share the same (maximal) common-word
 * prefix length with the Storsthlm name, this school-level admission
 * summary is attached to ALL of them -- deliberately, not by picking one
 * arbitrarily. It's the same real school's regional data either way; a
 * reader looking up any one campus/program entry should see it.
 */
function matchGymnasiumCandidates(storsthlmWords: string[], candidates: GymCandidate[]): GymCandidate[] {
  const scored: { length: number; candidate: GymCandidate }[] = [];
  for (const candidate of candidates) {
    if (candidate.words.length === 0 || storsthlmWords.length === 0) continue;
    const length = commonPrefixLength(storsthlmWords, candidate.words);
    if (length === 0) continue;
    if (!isFullPrefixRelation(storsthlmWords, candidate.words, length)) continue;
    scored.push({ length, candidate });
  }
  if (scored.length === 0) return [];
  const maxLength = Math.max(...scored.map((s) => s.length));
  return scored.filter((s) => s.length === maxLength).map((s) => s.candidate);
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function summarizeSchool(
  records: StorsthlmRecord[],
  kommun: string,
  schoolName: string
): RegionalAdmissionSummary {
  const realCutoffs = records
    .map((r) => r.antagningsgrans)
    .filter((v): v is number => v !== null && v > 0);
  const medians = records.map((r) => r.median).filter((v): v is number => v !== null);

  const avgCutoff =
    realCutoffs.length > 0 ? realCutoffs.reduce((a, b) => a + b, 0) / realCutoffs.length : null;
  const maxCutoff = realCutoffs.length > 0 ? Math.max(...realCutoffs) : null;
  const avgMedian = medians.length > 0 ? medians.reduce((a, b) => a + b, 0) / medians.length : null;

  return {
    avgCutoff,
    maxCutoff,
    avgMedian,
    programsWithCutoff: realCutoffs.length,
    programsTotal: records.length,
    year: records[0].year,
    sourceKommun: kommun,
    sourceSchoolName: schoolName,
  };
}

// ---------------------------------------------------------------------------
// Join
// ---------------------------------------------------------------------------

let _joinResult: RegionalJoinResult | null = null;

function loadStorsthlmRecords(): StorsthlmRecord[] {
  const jsonPath = path.join(process.cwd(), "data", "storsthlm-admission.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(raw) as StorsthlmFile;
  return parsed.records;
}

function buildRegionalJoin(): RegionalJoinResult {
  const records = loadStorsthlmRecords();

  // Group Storsthlm rows by (school, kommun) -- source data is per
  // school+program, one school has many program rows.
  const groups = new Map<string, { school: string; kommun: string; records: StorsthlmRecord[] }>();
  for (const r of records) {
    const key = `${r.school} ${r.kommun}`;
    const existing = groups.get(key);
    if (existing) {
      existing.records.push(r);
    } else {
      groups.set(key, { school: r.school, kommun: r.kommun, records: [r] });
    }
  }

  // gymnasium.json candidates, grouped by lowercased kommun. Uses the
  // already-cleaned `.name` from getAllGymnasiumSchools() -- read only,
  // never mutated.
  const nationalSchools = getAllGymnasiumSchools();
  const candidatesByKommun = new Map<string, GymCandidate[]>();
  for (const s of nationalSchools) {
    const key = s.municipality.toLowerCase();
    const list = candidatesByKommun.get(key) ?? [];
    list.push({ id: s.id, name: s.name, words: normalizeWords(s.name) });
    candidatesByKommun.set(key, list);
  }

  const overridesByKey = new Map<string, string[]>();
  for (const o of MANUAL_OVERRIDES) {
    overridesByKey.set(`${o.school} ${o.kommun}`, o.gymnasiumIds);
  }
  const nationalById = new Map(nationalSchools.map((s) => [s.id, s] as const));

  const byGymnasiumId = new Map<string, RegionalData>();
  const matchLog: MatchLogEntry[] = [];
  const unmatched: UnmatchedEntry[] = [];

  const attach = (
    ids: string[],
    school: string,
    kommun: string,
    method: MatchMethod,
    groupRecords: StorsthlmRecord[]
  ) => {
    const summary = summarizeSchool(groupRecords, kommun, school);
    const names: string[] = [];
    for (const id of ids) {
      byGymnasiumId.set(id, { admission: summary, elevnojdhet: null });
      names.push(nationalById.get(id)?.name ?? id);
    }
    matchLog.push({
      storsthlmSchool: school,
      storsthlmKommun: kommun,
      method,
      matchedGymnasiumIds: ids,
      matchedGymnasiumNames: names,
      programsTotal: groupRecords.length,
    });
  };

  for (const { school, kommun, records: groupRecords } of groups.values()) {
    const key = `${school} ${kommun}`;
    const candidates = candidatesByKommun.get(kommun.toLowerCase()) ?? [];
    const storsthlmWords = normalizeWords(school);
    const storsthlmNorm = storsthlmWords.join(" ");

    const exactMatches = candidates.filter((c) => normalize(c.name) === storsthlmNorm);
    if (exactMatches.length > 0) {
      attach(
        exactMatches.map((c) => c.id),
        school,
        kommun,
        "exact",
        groupRecords
      );
      continue;
    }

    const fuzzyMatches = matchGymnasiumCandidates(storsthlmWords, candidates);
    if (fuzzyMatches.length > 0) {
      attach(
        fuzzyMatches.map((c) => c.id),
        school,
        kommun,
        "fuzzy-prefix",
        groupRecords
      );
      continue;
    }

    const overrideIds = overridesByKey.get(key);
    if (overrideIds && overrideIds.length > 0) {
      attach(overrideIds, school, kommun, "override", groupRecords);
      continue;
    }

    unmatched.push({ school, kommun, programsTotal: groupRecords.length });
  }

  return {
    byGymnasiumId,
    matchLog,
    unmatched,
    storsthlmSchoolCount: groups.size,
  };
}

function getJoinResult(): RegionalJoinResult {
  if (!_joinResult) {
    _joinResult = buildRegionalJoin();
  }
  return _joinResult;
}

/**
 * Public lookup: regional data for one national gymnasium.json id, or the
 * all-null shape if this school has no Storsthlm match (outside the region,
 * or a name the matcher couldn't confidently resolve). Never throws, never
 * returns a "missing data" error state -- callers can render this
 * unconditionally.
 */
export function getRegionalDataForGymnasiumId(id: string): RegionalData {
  const result = getJoinResult();
  return result.byGymnasiumId.get(id) ?? { admission: null, elevnojdhet: null };
}

/** Full join result, for the verification script and any future debug/admin
 * tooling. Not meant to be imported by page components. */
export function getRegionalJoinResult(): RegionalJoinResult {
  return getJoinResult();
}
