import type { MetadataRoute } from "next";
import { getAllSchools, getAllMunicipalities } from "./lib/schools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://skolranking.com";
  const schools = getAllSchools();
  const municipalities = getAllMunicipalities();

  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/ranking`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/kommuner`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...municipalities.map((m) => ({
      url: `${base}/kommun/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...schools.map((s) => ({
      url: `${base}/skola/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
