import fs from "fs";
import path from "path";

export interface ForskolaUnit {
  id: string;
  name: string;
  municipality: string;
  municipalitySlug: string;
  childrenPerTeacher: number;
  certifiedShare: number | null;
  childrenPerStaff: number | null;
  rank: number;
  slug: string;
  year: number;
}

let _forskolaUnits: ForskolaUnit[] | null = null;

export function getAllForskolaUnits(): ForskolaUnit[] {
  if (_forskolaUnits) return _forskolaUnits;

  const jsonPath = path.join(process.cwd(), "data", "forskola.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(raw) as Array<{
    id: string;
    name: string;
    municipality: string;
    municipalitySlug: string;
    childrenPerTeacher: number | null;
    certifiedShare: number | null;
    childrenPerStaff: number | null;
    slug: string;
    year: number;
  }>;

  // Ranking metric is förskollärartäthet (children per certified preschool
  // teacher, lower is better) -- the closest available proxy to a quality
  // signal, since förskola has no exam/grade outcome data. Units without
  // this figure are excluded from the ranked list since there's nothing to
  // rank them by.
  const units: ForskolaUnit[] = parsed
    .filter((u): u is typeof u & { childrenPerTeacher: number } => u.childrenPerTeacher !== null)
    .map((u) => ({
      id: u.id,
      name: u.name,
      municipality: u.municipality,
      municipalitySlug: u.municipalitySlug,
      childrenPerTeacher: u.childrenPerTeacher,
      certifiedShare: u.certifiedShare,
      childrenPerStaff: u.childrenPerStaff,
      rank: 0,
      slug: u.slug,
      year: u.year,
    }));

  // Lower childrenPerTeacher = better (more teacher attention per child).
  units.sort((a, b) => a.childrenPerTeacher - b.childrenPerTeacher);
  units.forEach((u, i) => (u.rank = i + 1));

  _forskolaUnits = units;
  return units;
}

export function getForskolaUnitsByMunicipalitySlug(slug: string): ForskolaUnit[] {
  return getAllForskolaUnits().filter((u) => u.municipalitySlug === slug);
}

export function getAllForskolaMunicipalities(): { name: string; slug: string }[] {
  const map = new Map<string, string>();
  for (const u of getAllForskolaUnits()) {
    if (!map.has(u.municipalitySlug)) {
      map.set(u.municipalitySlug, u.municipality);
    }
  }
  return Array.from(map.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}
