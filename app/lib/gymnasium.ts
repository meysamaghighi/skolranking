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
  rank: number;
  slug: string;
  year: number;
}

let _gymnasiumSchools: GymnasiumSchool[] | null = null;

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
  const schools: GymnasiumSchool[] = parsed
    .filter((s): s is typeof s & { meritPoints: number } => s.meritPoints !== null)
    .map((s) => ({
      id: s.id,
      name: s.name,
      municipality: s.municipality,
      municipalitySlug: s.municipalitySlug,
      schoolType: s.schoolType,
      meritPoints: s.meritPoints,
      graduationRate: s.graduationRate,
      rank: 0,
      slug: s.slug,
      year: s.year,
    }));

  schools.sort((a, b) => b.meritPoints - a.meritPoints);
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
