import fs from "fs";
import path from "path";

export interface School {
  id: string;
  name: string;
  municipality: string;
  municipalitySlug: string;
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

export function muniSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/é/g, "e").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
      municipalitySlug: muniSlug(cols[2]),
      address: cols[3],
      meritValue,
      schoolType: cols[5],
      lat,
      lng,
      rank: 0,
      slug: slugify(cols[1], cols[0]),
    });
  }

  schools.sort((a, b) => b.meritValue - a.meritValue);
  schools.forEach((s, i) => (s.rank = i + 1));

  _schools = schools;
  return schools;
}

export function getSchoolBySlug(slug: string): School | undefined {
  return getAllSchools().find((s) => s.slug === slug);
}

export function getSchoolsByMunicipalitySlug(slug: string): School[] {
  return getAllSchools().filter((s) => s.municipalitySlug === slug);
}

export function getAllMunicipalities(): { name: string; slug: string }[] {
  const map = new Map<string, string>();
  for (const s of getAllSchools()) {
    if (!map.has(s.municipalitySlug)) {
      map.set(s.municipalitySlug, s.municipality);
    }
  }
  return Array.from(map.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

// -- SALSA data --

export interface SalsaEntry {
  deviation: number | null;
  expected: number | null;
  year: number;
}

let _salsa: Record<string, SalsaEntry> | null = null;

function loadSalsa(): Record<string, SalsaEntry> {
  if (_salsa) return _salsa;
  const salsaPath = path.join(process.cwd(), "data", "salsa.json");
  try {
    const raw = fs.readFileSync(salsaPath, "utf-8");
    _salsa = JSON.parse(raw);
  } catch {
    _salsa = {};
  }
  return _salsa!;
}

export function getSalsaForSchool(schoolId: string): SalsaEntry | null {
  const data = loadSalsa();
  return data[schoolId] || null;
}

export function getSalsaForMunicipality(muniSlugVal: string): { school: School; salsa: SalsaEntry }[] {
  const schools = getSchoolsByMunicipalitySlug(muniSlugVal);
  const data = loadSalsa();
  const results: { school: School; salsa: SalsaEntry }[] = [];
  for (const s of schools) {
    const entry = data[s.id];
    if (entry && entry.deviation !== null) {
      results.push({ school: s, salsa: entry });
    }
  }
  results.sort((a, b) => (b.salsa.deviation ?? 0) - (a.salsa.deviation ?? 0));
  return results;
}

export function getSchoolsJSON(): string {
  return JSON.stringify(
    getAllSchools().map((s) => ({
      id: s.id,
      n: s.name,
      m: s.municipality,
      ms: s.municipalitySlug,
      mv: s.meritValue,
      t: s.schoolType,
      la: s.lat,
      ln: s.lng,
      r: s.rank,
      s: s.slug,
    }))
  );
}
