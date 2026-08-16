import { getRegionalDataForGymnasiumId } from "../lib/gymnasium-regional";

/**
 * v2 task 5 of `agent/decisions/2026-07-29-skolranking-gymnasium-ranking-v2.md`
 * (indie-launcher repo) -- UI for the regional enrichment layer built in
 * task 4 (`app/lib/gymnasium-regional.ts`).
 *
 * Renders badges, never table columns: regional data only exists for
 * Storsthlm-region (Stockholm county) schools, so a column would be empty
 * for the rest of the country. A badge that simply doesn't render when
 * there's no data avoids that "broken looking" empty-column problem.
 */

// Small pill, same visual language as the rounded-full nav pills already
// used on this site (see app/page.tsx, app/gymnasium/page.tsx's "Grundskolor"
// link) -- just smaller and with a color fill instead of an outline, since
// these sit inline next to a school name inside a table row.
function Badge({
  children,
  title,
  color,
}: {
  children: React.ReactNode;
  title: string;
  color: "indigo" | "amber";
}) {
  const palette =
    color === "indigo"
      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
      : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${palette}`}
    >
      {children}
    </span>
  );
}

/**
 * Regional badges for one gymnasium.json school id. Renders nothing at all
 * (not even an empty wrapper) when the school has no regional data -- the
 * common case for ~97% of the country outside Stockholms län.
 */
export function RegionalBadges({ gymnasiumId }: { gymnasiumId: string }) {
  const regional = getRegionalDataForGymnasiumId(gymnasiumId);
  const avgCutoff = regional.admission?.avgCutoff ?? null;
  // elevnojdhet (v2 task 3, the Storsthlm satisfaction-survey scraper) has
  // not been built yet -- this is always null today. The type admits
  // `number | null` so this component renders it the moment task 3 lands,
  // with no further UI changes needed.
  const satisfaction = regional.elevnojdhet;

  if (avgCutoff === null && satisfaction === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {avgCutoff !== null && regional.admission && (
        <Badge
          color="indigo"
          title={`Snitt antagningspoäng ${regional.admission.year} (Storsthlm), baserat på ${regional.admission.programsWithCutoff} av ${regional.admission.programsTotal} program med antagningsgräns`}
        >
          Antagning ~{avgCutoff.toFixed(1)}p
        </Badge>
      )}
      {satisfaction !== null && (
        <Badge color="amber" title="Elevnöjdhet (Helhetsomdöme), Storsthlms elevenkät">
          Elevnöjdhet {satisfaction.toFixed(0)}%
        </Badge>
      )}
    </div>
  );
}

/**
 * "Så rankar vi gymnasier" methodology note -- factual explanation of the
 * ranking formula (see `app/lib/gymnasium.ts`'s computeRankingScore) plus
 * the regional badges' scope and source. Same category of content as the
 * SALSA explanations on /skola and /kommun pages: this is a data site
 * explaining its own methodology, not keyword-padding a game/tool page.
 */
export function GymnasiumMethodologyNote() {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 mt-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Så rankar vi gymnasier
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Rankingen väger genomsnittlig betygspoäng (70%) och examensandel inom tre år (30%) — data
        från Kolada/Skolverket. Skolor utan redovisad examensandel rankas enbart efter
        betygspoäng, utan att det räknas som ett minus. Antagningspoäng bestäms regionalt per
        intagningsomgång och ingår inte i rankingen; för skolor i Stockholms län visas snitt-
        antagningspoäng (källa: Storsthlms antagningsstatistik) som en badge när uppgift finns,
        liksom elevnöjdhet när sådan data finns tillgänglig.
      </p>
    </section>
  );
}
