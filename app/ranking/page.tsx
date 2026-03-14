import type { Metadata } from "next";
import Link from "next/link";
import { getAllSchools } from "../lib/schools";

export const metadata: Metadata = {
  title: "Alla grundskolor i Sverige rankade efter meritvärde 2025",
  description: "Komplett lista: alla 1 545 grundskolor i Sverige rankade efter genomsnittligt meritvärde. Data från Skolverket 2025.",
};

export default function RankingPage() {
  const schools = getAllSchools();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 inline-block">
          &larr; Hem
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Alla {schools.length} grundskolor rankade
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Komplett lista sorterad efter genomsnittligt meritvärde (slutbetyg årskurs 9, 2025)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-blue-50 dark:bg-gray-950">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Skola</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Kommun</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Meritvärde</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                  <td className="py-2 px-2 font-bold text-gray-400">{s.rank}</td>
                  <td className="py-2 px-2">
                    <Link href={`/skola/${s.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-2 px-2">
                    <Link href={`/kommun/${encodeURIComponent(s.municipality)}`} className="text-gray-600 dark:text-gray-400 hover:underline">
                      {s.municipality}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-gray-500">{s.schoolType}</td>
                  <td className="py-2 px-2 font-bold text-green-700 dark:text-green-400">{s.meritValue.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
