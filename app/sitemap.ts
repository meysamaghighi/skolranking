import type { MetadataRoute } from "next";
import { getAllMunicipalities } from "./lib/schools";
import { getAllForskolaMunicipalities } from "./lib/forskola";
import { getAllGymnasiumMunicipalities } from "./lib/gymnasium";

// Stable lastmod values. Google treats volatile/inaccurate lastmod as a negative
// signal — bump these only when the underlying content actually changes.
// SITE_LAST_MODIFIED: bump when the site's top-level pages/UX change.
// DATA_LAST_MODIFIED: bump when the Skolverket / SALSA dataset is refreshed.
// FORSKOLA_DATA_LAST_MODIFIED: bump when data/forskola.json is refreshed.
// GYMNASIUM_DATA_LAST_MODIFIED: bump when data/gymnasium.json is refreshed.
const SITE_LAST_MODIFIED = "2026-05-03";
const DATA_LAST_MODIFIED = "2025-09-01";
const FORSKOLA_DATA_LAST_MODIFIED = "2026-07-12";
const GYMNASIUM_DATA_LAST_MODIFIED = "2026-07-12";

// Individual school pages (/skola/[slug]) are intentionally excluded from the
// sitemap and marked noindex. They are thin programmatic pages (template + a
// few data fields) and Google was rejecting ~96% as "Discovered - currently
// not indexed". AdSense flagged the site for low-value content on 2026-04-19
// for the same reason. Only the ~290 enriched kommun pages + top-level pages
// are indexed now.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://skolranking.com";
  const municipalities = getAllMunicipalities();
  const forskolaMunicipalities = getAllForskolaMunicipalities();
  const gymnasiumMunicipalities = getAllGymnasiumMunicipalities();

  return [
    { url: base, lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/ranking`, lastModified: DATA_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/kommuner`, lastModified: DATA_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/forskola`, lastModified: FORSKOLA_DATA_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/gymnasium`, lastModified: GYMNASIUM_DATA_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/about`, lastModified: SITE_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.5 },
    ...municipalities.map((m) => ({
      url: `${base}/kommun/${m.slug}`,
      lastModified: DATA_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    ...forskolaMunicipalities.map((m) => ({
      url: `${base}/forskola/${m.slug}`,
      lastModified: FORSKOLA_DATA_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...gymnasiumMunicipalities.map((m) => ({
      url: `${base}/gymnasium/${m.slug}`,
      lastModified: GYMNASIUM_DATA_LAST_MODIFIED,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
