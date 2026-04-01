import Link from "next/link";
import type { Metadata } from "next";
import { getAllSchools, getAllMunicipalities, getSchoolsJSON, muniSlug } from "./lib/schools";
import SchoolSearch from "./components/SchoolSearch";

export const metadata: Metadata = {
  title: "Skolranking Sverige 2025 | Grundskolor & meritvärde",
  description:
    "Ranking av alla 1 545 grundskolor i Sverige efter meritvärde. Interaktiv karta, sök skola, filtrera kommun. Data från Skolverket.",
  keywords: [
    "skolranking sverige",
    "bästa grundskola",
    "meritvärde skola",
    "skolranking 2025",
    "bästa skolan i stockholm",
    "grundskola ranking",
    "skolverket meritvärde",
    "vilken skola är bäst",
    "skolval",
    "jämför skolor",
  ],
  openGraph: {
    title: "Skolranking Sverige 2025",
    description: "Interaktiv karta och ranking av alla grundskolor i Sverige. Data från Skolverket.",
    type: "website",
  },
};

export default function Home() {
  const schools = getAllSchools();
  const municipalities = getAllMunicipalities();
  const schoolsJSON = getSchoolsJSON();
  const top20 = schools.slice(0, 20);

  const avgMerit = (schools.reduce((s, c) => s + c.meritValue, 0) / schools.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 dark:text-white mb-3">
          Skolranking Sverige 2025
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
          Interaktiv karta och ranking av alla {schools.length.toLocaleString()} grundskolor i Sverige.
          Baserat på genomsnittligt meritvärde (slutbetyg årskurs 9).
        </p>
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mb-10">
          Källa: Skolverket 2025 &middot; Genomsnitt: {avgMerit} &middot; Högst: {schools[0].meritValue.toFixed(1)} &middot; Lägst: {schools[schools.length - 1].meritValue.toFixed(1)}
        </p>

        <SchoolSearch schoolsJSON={schoolsJSON} municipalities={municipalities} />

        {/* Top 20 ranking table */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Topp 20 grundskolor i Sverige 2025
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Skola</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Kommun</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Typ</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Meritvärde</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-2 font-bold text-gray-400">{s.rank}</td>
                    <td className="py-3 px-2">
                      <Link href={`/skola/${s.slug}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      <Link href={`/kommun/${s.municipalitySlug}`} className="text-gray-600 dark:text-gray-400 hover:underline">
                        {s.municipality}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{s.schoolType}</td>
                    <td className="py-3 px-2 font-bold text-green-700 dark:text-green-400">{s.meritValue.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center mt-4">
            <Link href="/ranking" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              Visa hela listan ({schools.length} skolor) &rarr;
            </Link>
          </p>
        </section>

        {/* Popular municipalities */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Skolranking per kommun
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping", "Västerås", "Örebro", "Helsingborg", "Norrköping", "Lund", "Umeå", "Jönköping", "Sundsvall", "Solna", "Nacka", "Lidingö"].map((m) => (
              <Link
                key={m}
                href={`/kommun/${muniSlug(m)}`}
                className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {m}
              </Link>
            ))}
            <Link
              href="/kommuner"
              className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              Alla kommuner &rarr;
            </Link>
          </div>
        </section>

        {/* SEO content */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Om skolranking och meritvärde
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-4 text-sm leading-relaxed">
            <p>
              Meritvärde är ett genomsnitt av elevernas slutbetyg i årskurs 9 och används som underlag
              för antagning till gymnasiet. Det maximala meritvärdet är 340 poäng (inklusive moderna språk).
              Ett högre meritvärde visar generellt på bättre kunskapsresultat, men påverkas av många faktorer.
            </p>
            <p>
              Den här webbplatsen visar alla {schools.length.toLocaleString()} grundskolor i Sverige med
              giltiga meritvärden för 2025, baserat på data från Skolverket. Skolorna är rankade och
              visualiserade på en interaktiv karta. Klicka på en skola för mer information, eller
              filtrera på kommun.
            </p>
            <p>
              Tänk på att meritvärde bara är en del av bilden. Andra faktorer som trygghet, studiero,
              lärartäthet och skolans profil är minst lika viktiga vid skolval.
            </p>
          </div>
        </section>
      </main>

      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100 dark:border-gray-800 mt-16">
        <p>Data från Skolverket 2025. Endast för informationsändamål.</p>
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
            "@type": "WebApplication",
            name: "Skolranking Sverige",
            description: "Interaktiv karta och ranking av alla grundskolor i Sverige baserat på meritvärde.",
            inLanguage: "sv",
            applicationCategory: "EducationApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
          }),
        }}
      />
    </div>
  );
}
