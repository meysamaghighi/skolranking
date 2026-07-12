import type { Metadata } from "next";
import Link from "next/link";
import { getAllForskolaUnits, getAllForskolaMunicipalities } from "../lib/forskola";

export const metadata: Metadata = {
  title: "Förskoleranking Sverige 2025 | Personaltäthet per förskola",
  description:
    "Ranking av förskolor i Sverige efter förskollärartäthet (barn per legitimerad förskollärare). Data från Kolada/Skolverket 2025.",
  keywords: [
    "förskoleranking",
    "bästa förskolan",
    "förskola ranking",
    "förskollärartäthet",
    "personaltäthet förskola",
    "vilken förskola är bäst",
    "jämför förskolor",
  ],
  alternates: {
    canonical: "/forskola",
  },
};

export default function ForskolaPage() {
  const units = getAllForskolaUnits();
  const municipalities = getAllForskolaMunicipalities();
  const avgDensity = (units.reduce((s, c) => s + c.childrenPerTeacher, 0) / units.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 inline-block">
          &larr; Hem
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Förskoleranking Sverige 2025
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {units.length.toLocaleString()} förskolor rankade efter förskollärartäthet
          (antal barn per legitimerad förskollärare), i {municipalities.length} kommuner.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
          Källa: Kolada / Skolverket 2025 &middot; Snitt: {avgDensity} barn/lärare &middot; Lägst (bäst): {units[0].childrenPerTeacher.toFixed(1)} &middot; Högst: {units[units.length - 1].childrenPerTeacher.toFixed(1)}
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
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Förskola</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Kommun</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Barn/lärare</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Legitimerad personal</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-2 px-2 font-bold text-gray-400">{u.rank}</td>
                  <td className="py-2 px-2">
                    <span className="text-gray-900 dark:text-gray-100">{u.name}</span>
                  </td>
                  <td className="py-2 px-2">
                    <Link href={`/forskola/${u.municipalitySlug}`} className="text-gray-600 dark:text-gray-400 hover:underline">
                      {u.municipality}
                    </Link>
                  </td>
                  <td className="py-2 px-2 font-bold text-green-700 dark:text-green-400">{u.childrenPerTeacher.toFixed(1)}</td>
                  <td className="py-2 px-2 text-gray-500">
                    {u.certifiedShare !== null ? `${u.certifiedShare.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8 leading-relaxed">
          Förskola har ingen betygs- eller provstatistik, till skillnad från grundskola och gymnasium.
          Rankingen bygger därför på förskollärartäthet: antal inskrivna barn per legitimerad
          förskollärare (lägre värde = fler lärare per barn). Legitimerad personal visar andelen
          heltidstjänster som innehas av personal med förskollärarlegitimation. Måtten avser
          förskolans läge oavsett huvudman (kommunal eller fristående).
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
            name: "Förskoleranking Sverige 2025",
            description: `Ranking av ${units.length} förskolor i Sverige efter förskollärartäthet`,
            numberOfItems: units.length,
            itemListElement: units.slice(0, 10).map((u, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Preschool",
                name: u.name,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
