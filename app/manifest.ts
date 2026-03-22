import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skolranking Sverige",
    short_name: "Skolranking",
    description: "Ranking av alla grundskolor i Sverige baserat på meritvärde.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#f59e0b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
