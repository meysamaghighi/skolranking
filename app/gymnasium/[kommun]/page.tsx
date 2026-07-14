import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllGymnasiumSchools,
  getAllGymnasiumMunicipalities,
  getGymnasiumSchoolsByMunicipalitySlug,
} from "../../lib/gymnasium";

interface Props {
  params: Promise<{ kommun: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllGymnasiumMunicipalities().map((m) => ({ kommun: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kommun: slug } = await params;
  const schools = getGymnasiumSchoolsByMunicipalitySlug(slug);
  if (schools.length === 0) return {};

  const municipality = schools[0].municipality;
  const sorted = [...schools].sort((a, b) => a.meritPoints - b.meritPoints).reverse();

  return {
    title: `Bästa gymnasiet i ${municipality} 2025 - Gymnasieranking`,
    description: `Vilket är bästa gymnasiet i ${municipality}? Jämför ${schools.length} gymnasieskolor efter betygspoäng. Nr 1: ${sorted[0].name} (${sorted[0].meritPoints.toFixed(1)} p). Data från Kolada/Skolverket 2025.`,
    keywords: [
      `bästa gymnasiet i ${municipality.toLowerCase()}`,
      `gymnasieranking ${municipality.toLowerCase()}`,
      `gymnasieskola ${municipality.toLowerCase()}`,
      `betygspoäng gymnasiet ${municipality.toLowerCase()}`,
    ],
    alternates: {
      canonical: `/gymnasium/${slug}`,
    },
  };
}

export default async function GymnasiumMunicipalityPage({ params }: Props) {
  const { kommun: slug } = await params;
  const schools = getGymnasiumSchoolsByMunicipalitySlug(slug);
  if (schools.length === 0) notFound();

  const municipality = schools[0].municipality;
  const sorted = [...schools].sort((a, b) => a.meritPoints - b.meritPoints).reverse();
  const avg = (schools.reduce((s, c) => s + c.meritPoints, 0) / schools.length).toFixed(1);
  const total = getAllGymnasiumSchools().length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Hem</Link>
          <span>/</span>
          <Link href="/gymnasium" className="hover:text-gray-700 dark:hover:text-gray-200">Gymnasium</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{municipality}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Bästa gymnasiet i {municipality} - Gymnasieranking 2025
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {sorted.length} {sorted.length === 1 ? "gymnasieskola" : "gymnasieskolor"} &middot; Genomsnittlig betygspoäng: {avg}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Lokal #</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Skola</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Betygspoäng</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Examen (%)</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Sverige #</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-3 px-2 font-bold text-gray-400">{i + 1}</td>
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                  <td className="py-3 px-2 text-gray-500">{s.schoolType}</td>
                  <td className="py-3 px-2 font-bold text-green-700 dark:text-green-400">{s.meritPoints.toFixed(1)}</td>
                  <td className="py-3 px-2 text-gray-500">
                    {s.graduationRate !== null ? `${s.graduationRate.toFixed(0)}%` : "—"}
                  </td>
                  <td className="py-3 px-2 text-gray-500">#{s.rank} av {total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8 leading-relaxed">
          Betygspoäng avser genomsnittlig betygspoäng för gymnasieelever med examen. Examensandel avser
          andel elever som tog examen inom 3 år. Antagningspoäng bestäms regionalt per intag och ingår
          inte i denna ranking.
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
            name: `Gymnasieskolor i ${municipality}`,
            description: `Ranking av ${sorted.length} gymnasieskolor i ${municipality} efter betygspoäng`,
            numberOfItems: sorted.length,
            itemListElement: sorted.slice(0, 10).map((s, i) => ({
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
