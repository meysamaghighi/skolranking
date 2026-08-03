import fs from "fs";
import path from "path";

export interface GymnasiumSchool {
  id: string;
  name: string;
  municipality: string;
  municipalitySlug: string;
  schoolType: string;
  meritPoints: number;
  graduationRate: number | null;
  rankingScore: number;
  rank: number;
  slug: string;
  year: number;
}

let _gymnasiumSchools: GymnasiumSchool[] | null = null;

// Ranking blends two Kolada signals instead of betygspoäng alone: a school
// that pushes every admitted student to actually graduate is doing something
// raw grade averages can't see (and vice versa -- a school can post strong
// grades among only the students who make it to examen while quietly losing
// others along the way). Merit points still carry most of the weight since
// it's the long-established headline metric; graduation rate is the
// secondary correction. Schools without a graduation-rate figure (73 of
// 1,030) fall back to a merit-only score -- missing data must never look
// like a penalty.
const MERIT_WEIGHT = 0.7;
const GRADUATION_WEIGHT = 0.3;

function computeRankingScore(
  meritPoints: number,
  graduationRate: number | null,
  meritMin: number,
  meritMax: number
): number {
  const meritNormalized =
    meritMax > meritMin ? ((meritPoints - meritMin) / (meritMax - meritMin)) * 100 : 100;
  if (graduationRate === null) return meritNormalized;
  return meritNormalized * MERIT_WEIGHT + graduationRate * GRADUATION_WEIGHT;
}

export function getAllGymnasiumSchools(): GymnasiumSchool[] {
  if (_gymnasiumSchools) return _gymnasiumSchools;

  const jsonPath = path.join(process.cwd(), "data", "gymnasium.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(raw) as Array<{
    id: string;
    name: string;
    municipality: string;
    municipalitySlug: string;
    schoolType: string;
    meritPoints: number | null;
    graduationRate: number | null;
    slug: string;
    year: number;
  }>;

  // Ranking metric is genomsnittlig betygspoäng (average graduate grade
  // points). A handful of schools only have a graduation-rate figure with
  // no grade points on record -- they're excluded from the ranked list
  // since there's nothing to rank them by.
  const withMerit = parsed.filter(
    (s): s is typeof s & { meritPoints: number } => s.meritPoints !== null
  );
  const meritValues = withMerit.map((s) => s.meritPoints);
  const meritMin = Math.min(...meritValues);
  const meritMax = Math.max(...meritValues);

  const schools: GymnasiumSchool[] = withMerit.map((s) => ({
    id: s.id,
    // Registry names sometimes carry a trailing school-unit code
    // ("Norra Real 82964090") — strip long digit runs, keep real campus
    // numbers ("Hvitfeldtska gymnasiet 3").
    name: s.name.replace(/\s+\d{6,}$/, ""),
    municipality: s.municipality,
    municipalitySlug: s.municipalitySlug,
    schoolType: s.schoolType,
    meritPoints: s.meritPoints,
    graduationRate: s.graduationRate,
    rankingScore: computeRankingScore(s.meritPoints, s.graduationRate, meritMin, meritMax),
    rank: 0,
    slug: s.slug,
    year: s.year,
  }));

  schools.sort((a, b) => b.rankingScore - a.rankingScore);
  schools.forEach((s, i) => (s.rank = i + 1));

  _gymnasiumSchools = schools;
  return schools;
}

export function getGymnasiumSchoolsByMunicipalitySlug(slug: string): GymnasiumSchool[] {
  return getAllGymnasiumSchools().filter((s) => s.municipalitySlug === slug);
}

export function getAllGymnasiumMunicipalities(): { name: string; slug: string }[] {
  const map = new Map<string, string>();
  for (const s of getAllGymnasiumSchools()) {
    if (!map.has(s.municipalitySlug)) {
      map.set(s.municipalitySlug, s.municipality);
    }
  }
  return Array.from(map.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}
