import type { MetadataRoute } from "next";
import { getAllSchools, getAllMunicipalities } from "./lib/schools";

// Stable lastmod values. Google treats volatile/inaccurate lastmod as a negative
// signal — bump these only when the underlying content actually changes.
// SITE_LAST_MODIFIED: bump when the site's top-level pages/UX change.
// DATA_LAST_MODIFIED: bump when the Skolverket / SALSA dataset is refreshed.
const SITE_LAST_MODIFIED = "2026-04-17";
const DATA_LAST_MODIFIED = "2025-09-01";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://skolranking.com";
  const schools = getAllSchools();
  const municipalities = getAllMunicipalities();

  return [
    { url: base, lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/ranking`, lastModified: DATA_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/kommuner`, lastModified: DATA_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/about`, lastModified: SITE_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.5 },
    ...municipalities.map((m) => ({
      url: `${base}/kommun/${m.slug}`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...schools.map((s) => ({
      url: `${base}/skola/${s.slug}`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
