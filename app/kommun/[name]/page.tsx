import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllSchools, getAllMunicipalities, getSchoolsByMunicipality } from "../../lib/schools";

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  return getAllMunicipalities().map((m) => ({ name: m }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const municipality = name;
  const schools = getSchoolsByMunicipality(municipality);
  if (schools.length === 0) return {};

  const sorted = [...schools].sort((a, b) => a.rank - b.rank);
  const avg = (schools.reduce((s, c) => s + c.meritValue, 0) / schools.length).toFixed(1);

  return {
    title: `Bästa grundskolor i ${municipality} 2025 | Skolranking & meritvärde`,
    description: `Ranking av alla ${schools.length} grundskolor i ${municipality} baserat på meritvärde. Bästa: ${sorted[0].name} (${sorted[0].meritValue.toFixed(1)}). Genomsnitt: ${avg}. Data från Skolverket 2025.`,
    keywords: [
      `bästa skola ${municipality}`,
      `skolranking ${municipality}`,
      `grundskola ${municipality}`,
      `meritvärde ${municipality}`,
      `skolor i ${municipality}`,
    ],
  };
}

export default async function MunicipalityPage({ params }: Props) {
  const { name } = await params;
  const municipality = name;
  const schools = getSchoolsByMunicipality(municipality);
  if (schools.length === 0) notFound();

  const sorted = [...schools].sort((a, b) => a.rank - b.rank);
  const avg = (schools.reduce((s, c) => s + c.meritValue, 0) / schools.length).toFixed(1);
  const total = getAllSchools().length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Hem</Link>
          <span>/</span>
          <Link href="/kommuner" className="hover:text-gray-700 dark:hover:text-gray-200">Kommuner</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{municipality}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Grundskolor i {municipality}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {sorted.length} skolor &middot; Genomsnittligt meritvärde: {avg}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Lokal #</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Skola</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Meritvärde</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Sverige #</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-3 px-2 font-bold text-gray-400">{i + 1}</td>
                  <td className="py-3 px-2">
                    <Link href={`/skola/${s.slug}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-gray-500">{s.schoolType}</td>
                  <td className="py-3 px-2 font-bold text-green-700 dark:text-green-400">{s.meritValue.toFixed(1)}</td>
                  <td className="py-3 px-2 text-gray-500">#{s.rank} av {total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100 dark:border-gray-800 mt-16">
        <p>Data från Skolverket 2025. Endast för informationsändamål.</p>
      </footer>
    </div>
  );
}
