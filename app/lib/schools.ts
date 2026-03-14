import fs from "fs";
import path from "path";

export interface School {
  id: string;
  name: string;
  municipality: string;
  address: string;
  meritValue: number;
  schoolType: string;
  lat: number;
  lng: number;
  rank: number;
  slug: string;
}

let _schools: School[] | null = null;

function slugify(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/é/g, "e").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

export function getAllSchools(): School[] {
  if (_schools) return _schools;

  const csvPath = path.join(process.cwd(), "data", "schools_with_coordinates.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n");

  const schools: School[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 8) continue;
    const meritValue = parseFloat(cols[4]);
    const lat = parseFloat(cols[6]);
    const lng = parseFloat(cols[7]);
    if (isNaN(meritValue) || isNaN(lat) || isNaN(lng)) continue;

    schools.push({
      id: cols[0],
      name: cols[1],
      municipality: cols[2],
      address: cols[3],
      meritValue,
      schoolType: cols[5],
      lat,
      lng,
      rank: 0,
      slug: slugify(cols[1], cols[0]),
    });
  }

  // Sort by merit descending, assign ranks
  schools.sort((a, b) => b.meritValue - a.meritValue);
  schools.forEach((s, i) => (s.rank = i + 1));

  _schools = schools;
  return schools;
}

export function getSchoolBySlug(slug: string): School | undefined {
  return getAllSchools().find((s) => s.slug === slug);
}

export function getSchoolsByMunicipality(municipality: string): School[] {
  return getAllSchools().filter((s) => s.municipality === municipality);
}

export function getAllMunicipalities(): string[] {
  const munis = new Set(getAllSchools().map((s) => s.municipality));
  return Array.from(munis).sort();
}

export function getSchoolsJSON(): string {
  return JSON.stringify(
    getAllSchools().map((s) => ({
      id: s.id,
      n: s.name,
      m: s.municipality,
      mv: s.meritValue,
      t: s.schoolType,
      la: s.lat,
      ln: s.lng,
      r: s.rank,
      s: s.slug,
    }))
  );
}
