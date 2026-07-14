import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllForskolaUnits,
  getAllForskolaMunicipalities,
  getForskolaUnitsByMunicipalitySlug,
} from "../../lib/forskola";

interface Props {
  params: Promise<{ kommun: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllForskolaMunicipalities().map((m) => ({ kommun: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kommun: slug } = await params;
  const units = getForskolaUnitsByMunicipalitySlug(slug);
  if (units.length === 0) return {};

  const municipality = units[0].municipality;
  const sorted = [...units].sort((a, b) => a.childrenPerTeacher - b.childrenPerTeacher);

  return {
    title: `Bästa förskolan i ${municipality} 2025 - Förskoleranking`,
    description: `Vilken förskola i ${municipality} har högst förskollärartäthet? Jämför ${units.length} förskolor. Nr 1: ${sorted[0].name} (${sorted[0].childrenPerTeacher.toFixed(1)} barn/lärare). Data från Kolada/Skolverket 2025.`,
    keywords: [
      `bästa förskolan i ${municipality.toLowerCase()}`,
      `förskoleranking ${municipality.toLowerCase()}`,
      `förskola ${municipality.toLowerCase()}`,
      `förskollärartäthet ${municipality.toLowerCase()}`,
    ],
    alternates: {
      canonical: `/forskola/${slug}`,
    },
  };
}

export default async function ForskolaMunicipalityPage({ params }: Props) {
  const { kommun: slug } = await params;
  const units = getForskolaUnitsByMunicipalitySlug(slug);
  if (units.length === 0) notFound();

  const municipality = units[0].municipality;
  const sorted = [...units].sort((a, b) => a.childrenPerTeacher - b.childrenPerTeacher);
  const avg = (units.reduce((s, c) => s + c.childrenPerTeacher, 0) / units.length).toFixed(1);
  const total = getAllForskolaUnits().length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Hem</Link>
          <span>/</span>
          <Link href="/forskola" className="hover:text-gray-700 dark:hover:text-gray-200">Förskola</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{municipality}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Bästa förskolan i {municipality} - Förskoleranking 2025
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {sorted.length} {sorted.length === 1 ? "förskola" : "förskolor"} &middot; Snitt förskollärartäthet: {avg} barn/lärare
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Lokal #</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Förskola</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Barn/lärare</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Legitimerad personal</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Sverige #</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, i) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-3 px-2 font-bold text-gray-400">{i + 1}</td>
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                  <td className="py-3 px-2 font-bold text-green-700 dark:text-green-400">{u.childrenPerTeacher.toFixed(1)}</td>
                  <td className="py-3 px-2 text-gray-500">
                    {u.certifiedShare !== null ? `${u.certifiedShare.toFixed(0)}%` : "—"}
                  </td>
                  <td className="py-3 px-2 text-gray-500">#{u.rank} av {total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8 leading-relaxed">
          Förskola har ingen betygs- eller provstatistik. Rankingen bygger på förskollärartäthet:
          antal inskrivna barn per legitimerad förskollärare (lägre värde = fler lärare per barn).
          Legitimerad personal visar andelen heltidstjänster med förskollärarlegitimation.
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
            name: `Förskolor i ${municipality}`,
            description: `Ranking av ${sorted.length} förskolor i ${municipality} efter förskollärartäthet`,
            numberOfItems: sorted.length,
            itemListElement: sorted.slice(0, 10).map((u, i) => ({
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
