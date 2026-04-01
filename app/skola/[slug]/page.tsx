import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllSchools, getSchoolBySlug, getSchoolsByMunicipalitySlug, getSalsaForSchool } from "../../lib/schools";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllSchools().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) return {};

  return {
    title: `${school.name} - Meritvärde ${school.meritValue.toFixed(1)} | Ranking #${school.rank} i Sverige`,
    description: `${school.name} i ${school.municipality} har meritvärde ${school.meritValue.toFixed(1)} och är rankad #${school.rank} av ${getAllSchools().length} grundskolor i Sverige. ${school.schoolType} skola. Adress: ${school.address}.`,
    keywords: [
      school.name,
      `${school.name} meritvärde`,
      `${school.name} ranking`,
      `bästa skola ${school.municipality}`,
      `grundskola ${school.municipality}`,
      `meritvärde ${school.municipality}`,
    ],
  };
}

export default async function SchoolPage({ params }: Props) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const allSchools = getAllSchools();
  const total = allSchools.length;
  const muniSchools = getSchoolsByMunicipalitySlug(school.municipalitySlug).sort((a, b) => a.rank - b.rank);
  const muniRank = muniSchools.findIndex((s) => s.id === school.id) + 1;

  // Nearby in ranking
  const nearby = allSchools.filter((s) => Math.abs(s.rank - school.rank) <= 3 && s.id !== school.id);

  const percentile = Math.round(((total - school.rank) / total) * 100);

  // SALSA data
  const salsa = getSalsaForSchool(school.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">Hem</Link>
          <span>/</span>
          <Link href={`/kommun/${school.municipalitySlug}`} className="hover:text-gray-700 dark:hover:text-gray-200">
            {school.municipality}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{school.name}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {school.name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {school.municipality} &middot; {school.schoolType} &middot; {school.address}
        </p>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard label="Meritvärde" value={school.meritValue.toFixed(1)} highlight />
          <StatCard label="Ranking (Sverige)" value={`#${school.rank} av ${total}`} />
          <StatCard label={`Ranking (${school.municipality})`} value={`#${muniRank} av ${muniSchools.length}`} />
          <StatCard label="Percentil" value={`Topp ${100 - percentile}%`} />
        </div>

        {/* Performance bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Meritvärde jämfört med Sverige</h2>
          <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              style={{ width: `${(school.meritValue / 340) * 100}%` }}
            />
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
              {school.meritValue.toFixed(1)} / 340
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>Snitt: {(allSchools.reduce((s, c) => s + c.meritValue, 0) / total).toFixed(1)}</span>
            <span>340</span>
          </div>
        </div>

        {/* SALSA */}
        {salsa && salsa.deviation !== null && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 mb-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              SALSA-analys
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Faktiskt meritvärde</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{school.meritValue.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Förväntat (SALSA)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {salsa.expected !== null ? salsa.expected.toFixed(1) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avvikelse</p>
                <p className={`text-xl font-bold ${
                  salsa.deviation > 0
                    ? "text-green-600 dark:text-green-400"
                    : salsa.deviation < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500"
                }`}>
                  {salsa.deviation > 0 ? "+" : ""}{salsa.deviation.toFixed(1)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              SALSA justerar för socioekonomiska faktorer (föräldrars utbildningsnivå, andel nyanlända m.m.).{" "}
              {salsa.deviation > 0
                ? "Positivt värde innebär att eleverna presterar bättre än förväntat givet skolans elevsammansättning."
                : salsa.deviation < 0
                  ? "Negativt värde innebär att eleverna presterar under förväntan givet skolans elevsammansättning."
                  : "Noll innebär att eleverna presterar exakt som förväntat."}{" "}
              Data: Kolada (SALSA) {salsa.year}.
            </p>
          </div>
        )}

        {/* Nearby in ranking */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skolor med liknande ranking</h2>
          <div className="space-y-2">
            {nearby.map((s) => (
              <Link
                key={s.id}
                href={`/skola/${s.slug}`}
                className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-300 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-gray-400 mr-2">#{s.rank}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{s.municipality}</span>
                </div>
                <span className="text-green-700 dark:text-green-400 font-bold">{s.meritValue.toFixed(1)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Other schools in municipality */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Alla skolor i {school.municipality}
          </h2>
          <div className="space-y-2">
            {muniSchools.slice(0, 10).map((s) => (
              <Link
                key={s.id}
                href={`/skola/${s.slug}`}
                className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                  s.id === school.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-300"
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-gray-400 mr-2">#{s.rank}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                </div>
                <span className="text-green-700 dark:text-green-400 font-bold">{s.meritValue.toFixed(1)}</span>
              </Link>
            ))}
          </div>
          {muniSchools.length > 10 && (
            <p className="text-center mt-3">
              <Link href={`/kommun/${school.municipalitySlug}`} className="text-blue-600 text-sm hover:underline">
                Visa alla {muniSchools.length} skolor i {school.municipality} &rarr;
              </Link>
            </p>
          )}
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
            "@type": "School",
            name: school.name,
            address: {
              "@type": "PostalAddress",
              streetAddress: school.address,
              addressLocality: school.municipality,
              addressCountry: "SE",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: school.lat,
              longitude: school.lng,
            },
          }),
        }}
      />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-white dark:bg-gray-900 shadow"}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}
