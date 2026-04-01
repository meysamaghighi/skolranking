import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om Skolranking | Fri skolranking för alla grundskolor i Sverige",
  description:
    "Om Skolranking.com - en kostnadsfri webbplats som rankar alla 1 545 grundskolor i Sverige efter meritvärde. Data från Skolverket, interaktiv karta, sökning och jämförelser.",
  openGraph: {
    title: "Om Skolranking",
    description: "En fri webbplats för skolranking i Sverige baserat på Skolverkets data.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            &larr; Tillbaka till startsidan
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Om Skolranking
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          {/* Vad är Skolranking */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Vad är Skolranking?
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-4 leading-relaxed">
              <p>
                Skolranking.com är en kostnadsfri webbplats som rankar alla{" "}
                <strong>1 545 grundskolor i Sverige</strong> baserat på genomsnittligt
                meritvärde från årskurs 9. Vår målsättning är att göra skoldata mer
                tillgänglig och hjälpa föräldrar, elever och andra intresserade att
                jämföra och utforska grundskolor i hela landet.
              </p>
              <p>
                All data kommer från{" "}
                <a
                  href="https://www.skolverket.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Skolverket
                </a>{" "}
                (Statens Skolverks öppna data) och uppdateras regelbundet för att
                återspegla de senaste betygen och statistiken.
              </p>
            </div>
          </section>

          {/* Funktioner */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Funktioner
            </h2>
            <ul className="text-gray-600 dark:text-gray-400 space-y-3">
              <li>
                <strong>Interaktiv karta</strong> - Visualisera alla grundskolor på en
                karta och se meritvärde geografiskt.
              </li>
              <li>
                <strong>Sök och filtrera</strong> - Hitta skolor efter namn, kommun eller
                skoltyp (kommunal/fristående).
              </li>
              <li>
                <strong>Rankingsidor per kommun</strong> - Jämför grundskolor inom samma
                kommun.
              </li>
              <li>
                <strong>Detaljsidor per skola</strong> - Se fullständig information om
                varje skola, inklusive adress, kontaktuppgifter och position i rankningen.
              </li>
              <li>
                <strong>SALSA-jämförelser</strong> - Kommande funktion för att jämföra
                skolor med liknande socioekonomiska förutsättningar.
              </li>
            </ul>
          </section>

          {/* Vem bygger detta */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Vem bygger detta?
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-4 leading-relaxed">
              <p>
                Skolranking.com byggs och underhålls av{" "}
                <strong>MeyDev</strong>, en oberoende utvecklare som skapar
                användbara verktyg och appar för allmänheten. Webbplatsen är helt
                kostnadsfri att använda och kräver varken konto eller nedladdning.
              </p>
              <p>
                Har du frågor, förslag eller feedback? Kontakta oss gärna på{" "}
                <a
                  href="mailto:meydev.studio@gmail.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  meydev.studio@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Integritet och data */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Integritet och data
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-4 leading-relaxed">
              <p>
                <strong>Inga konton, inga personuppgifter.</strong> Skolranking.com
                samlar inte in några personuppgifter eller kräver registrering. Du kan
                använda webbplatsen helt anonymt.
              </p>
              <p>
                <strong>Google Analytics.</strong> Vi använder Google Analytics (GA4)
                för att samla in anonym användningsstatistik, till exempel antal besök,
                populära sidor och geografisk plats (på landsnivå). Detta hjälper oss
                att förbättra webbplatsen. Inga personligt identifierbara uppgifter
                lagras.
              </p>
              <p>
                <strong>Google AdSense.</strong> För att täcka kostnader för drift och
                underhåll kan webbplatsen visa icke-påträngande annonser via Google
                AdSense. Du kan använda en annonsblockerare om du föredrar det.
              </p>
              <p>
                <strong>Öppen data från Skolverket.</strong> All skoldata på
                webbplatsen är offentlig och hämtas från Skolverkets officiella datakällor.
                Vi gör inga egna bedömningar eller justeringar av meritvärden.
              </p>
            </div>
          </section>

          {/* Viktigt att veta */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Viktigt att veta om meritvärde
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-4 leading-relaxed">
              <p>
                Meritvärde är ett genomsnitt av elevernas slutbetyg i årskurs 9 och
                används som underlag för gymnasieantagning. Ett högt meritvärde visar
                generellt på goda kunskapsresultat, men det är viktigt att komma ihåg
                att meritvärde bara är <em>en</em> del av bilden.
              </p>
              <p>
                Andra faktorer som trygghet, studiero, lärartäthet, skolmiljö och
                skolans profil är minst lika viktiga vid skolval. Vi rekommenderar att
                du besöker skolor, pratar med rektorer och lärare, och läser mer på
                Skolverkets officiella webbplats innan du fattar beslut.
              </p>
              <p>
                Meritvärde påverkas också av socioekonomiska faktorer. SALSA-jämförelser
                (kommande funktion) kommer att göra det enklare att jämföra skolor med
                liknande förutsättningar.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Utforska skolranking
          </Link>
        </div>
      </main>

      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-100 dark:border-gray-800 mt-16">
        <p>Data från Skolverket 2025. Endast för informationsändamål.</p>
        <p className="mt-2">
          <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            Om oss
          </Link>
        </p>
      </footer>
    </div>
  );
}
