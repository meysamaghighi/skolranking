import type { Metadata } from "next";
import Link from "next/link";
import { getAllGymnasiumSchools, getAllGymnasiumMunicipalities } from "../lib/gymnasium";

export const metadata: Metadata = {
  title: "Gymnasieranking Sverige 2025 | Bästa gymnasieskolorna",
  description:
    "Ranking av gymnasieskolor i Sverige efter genomsnittlig betygspoäng och examensandel. Data från Kolada/Skolverket 2025.",
  keywords: [
    "gymnasieranking",
    "bästa gymnasiet",
    "gymnasieskola ranking",
    "betygspoäng gymnasiet",
    "vilket gymnasium är bäst",
    "gymnasieval",
    "jämför gymnasieskolor",
  ],
  alternates: {
    canonical: "/gymnasium",
  },
};

export default function GymnasiumPage() {
  const schools = getAllGymnasiumSchools();
  const municipalities = getAllGymnasiumMunicipalities();
  const avgMerit = (schools.reduce((s, c) => s + c.meritPoints, 0) / schools.length).toFixed(1);
  const meritValues = schools.map((s) => s.meritPoints);
  const highestMerit = Math.max(...meritValues).toFixed(1);
  const lowestMerit = Math.min(...meritValues).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 inline-block">
          &larr; Hem
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Gymnasieranking Sverige 2025
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {schools.length.toLocaleString()} gymnasieskolor rankade efter genomsnittlig betygspoäng
          och examensandel, i {municipalities.length} kommuner.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
          Källa: Kolada / Skolverket 2025 &middot; Snittpoäng: {avgMerit} &middot; Högst: {highestMerit} &middot; Lägst: {lowestMerit}
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/"
            className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            Grundskolor &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-blue-50 dark:bg-gray-950">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Skola</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Kommun</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Betygspoäng</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Examen (%)</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-2 px-2 font-bold text-gray-400">{s.rank}</td>
                  <td className="py-2 px-2">
                    <span className="text-gray-900 dark:text-gray-100">{s.name}</span>
                  </td>
                  <td className="py-2 px-2">
                    <Link href={`/gymnasium/${s.municipalitySlug}`} className="text-gray-600 dark:text-gray-400 hover:underline">
                      {s.municipality}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-gray-500">{s.schoolType}</td>
                  <td className="py-2 px-2 font-bold text-green-700 dark:text-green-400">{s.meritPoints.toFixed(1)}</td>
                  <td className="py-2 px-2 text-gray-500">
                    {s.graduationRate !== null ? `${s.graduationRate.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8 leading-relaxed">
          Rankingen väger genomsnittlig betygspoäng (70%) och examensandel inom 3 år (30%) — skolor
          utan examensandel rankas enbart efter betygspoäng. Antagningspoäng (den poäng som krävs
          för att bli antagen) bestäms regionalt per intag och ingår inte i denna ranking.
        </p>
      </main>

      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100 dark:border-gray-800 mt-16">
        <p>Data från Kolada / Skolverket 2025. Endast för informationsändamål.</p>
        <p className="mt-2">
          <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            Om oss
          </Link>
        </p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Gymnasieranking Sverige 2025",
            description: `Ranking av ${schools.length} gymnasieskolor i Sverige efter genomsnittlig betygspoäng och examensandel`,
            numberOfItems: schools.length,
            itemListElement: schools.slice(0, 10).map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "School",
                name: s.name,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
