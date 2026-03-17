import type { Metadata } from "next";
import Link from "next/link";
import { getAllMunicipalities, getSchoolsByMunicipalitySlug } from "../lib/schools";

export const metadata: Metadata = {
  title: "Alla kommuner | Skolranking Sverige 2025",
  description: "Skolranking per kommun i Sverige. Välj en kommun för att se alla grundskolor rankade efter meritvärde.",
};

export default function KommunerPage() {
  const municipalities = getAllMunicipalities();
  const muniData = municipalities.map((m) => {
    const schools = getSchoolsByMunicipalitySlug(m.slug);
    const avg = schools.reduce((s, c) => s + c.meritValue, 0) / schools.length;
    return { name: m.name, slug: m.slug, count: schools.length, avg };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 inline-block">
          &larr; Hem
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Alla kommuner</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{municipalities.length} kommuner, sorterade efter genomsnittligt meritvärde</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Kommun</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Antal skolor</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Snitt meritvärde</th>
              </tr>
            </thead>
            <tbody>
              {muniData.map((m, i) => (
                <tr key={m.slug} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-3 px-2 text-gray-400 font-bold">{i + 1}</td>
                  <td className="py-3 px-2">
                    <Link href={`/kommun/${m.slug}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-gray-500">{m.count}</td>
                  <td className="py-3 px-2 font-bold text-green-700 dark:text-green-400">{m.avg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Kommuner i Sverige - Skolranking",
            description: `Ranking av ${municipalities.length} kommuner efter genomsnittligt meritvärde`,
            numberOfItems: muniData.length,
            itemListElement: muniData.slice(0, 20).map((m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Place",
                name: m.name,
                url: `https://skolranking.com/kommun/${m.slug}`,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
