import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllSchools, getAllMunicipalities, getSchoolsByMunicipalitySlug, getSalsaForMunicipality } from "../../lib/schools";

interface Props {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllMunicipalities().map((m) => ({ name: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name: slug } = await params;
  const schools = getSchoolsByMunicipalitySlug(slug);
  if (schools.length === 0) return {};

  const municipality = schools[0].municipality;
  const sorted = [...schools].sort((a, b) => a.rank - b.rank);
  const avg = (schools.reduce((s, c) => s + c.meritValue, 0) / schools.length).toFixed(1);

  // Special SEO treatment for Sweden's largest cities
  if (slug === "goteborg") {
    return {
      title: `Bästa skolan i Göteborg 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Göteborg? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i göteborg",
        "bästa skolan i göteborg",
        "skolranking göteborg",
        "grundskola göteborg",
        "meritvärde göteborg",
        "skolor i göteborg",
        "vilken skola är bäst i göteborg",
        "göteborg skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "stockholm") {
    return {
      title: `Bästa skolan i Stockholm 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Stockholm? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i stockholm",
        "bästa skolan i stockholm",
        "skolranking stockholm",
        "grundskola stockholm",
        "meritvärde stockholm",
        "skolor i stockholm",
        "vilken skola är bäst i stockholm",
        "stockholm skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "malmo") {
    return {
      title: `Bästa skolan i Malmö 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Malmö? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i malmö",
        "bästa skolan i malmö",
        "skolranking malmö",
        "grundskola malmö",
        "meritvärde malmö",
        "skolor i malmö",
        "vilken skola är bäst i malmö",
        "malmö skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "trollhattan") {
    return {
      title: `Bästa skolan i Trollhättan 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Trollhättan? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i trollhättan",
        "bästa skolan i trollhättan",
        "skolranking trollhättan",
        "grundskola trollhättan",
        "meritvärde trollhättan",
        "skolor i trollhättan",
        "vilken skola är bäst i trollhättan",
        "trollhättan skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "lidingo") {
    return {
      title: `Bästa skolan i Lidingö 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Lidingö? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i lidingö",
        "bästa skolan i lidingö",
        "skolranking lidingö",
        "grundskola lidingö",
        "meritvärde lidingö",
        "skolor i lidingö",
        "vilken skola är bäst i lidingö",
        "lidingö skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "sollentuna") {
    return {
      title: `Bästa skolan i Sollentuna 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Sollentuna? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i sollentuna",
        "bästa skolan i sollentuna",
        "skolranking sollentuna",
        "grundskola sollentuna",
        "meritvärde sollentuna",
        "skolor i sollentuna",
        "vilken skola är bäst i sollentuna",
        "sollentuna skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "uppsala") {
    return {
      title: `Bästa skolan i Uppsala 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Uppsala? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i uppsala",
        "bästa skolan i uppsala",
        "skolranking uppsala",
        "grundskola uppsala",
        "meritvärde uppsala",
        "skolor i uppsala",
        "vilken skola är bäst i uppsala",
        "uppsala skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "linkoping") {
    return {
      title: `Bästa skolan i Linköping 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Linköping? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i linköping",
        "bästa skolan i linköping",
        "skolranking linköping",
        "grundskola linköping",
        "meritvärde linköping",
        "skolor i linköping",
        "vilken skola är bäst i linköping",
        "linköping skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "vasteras") {
    return {
      title: `Bästa skolan i Västerås 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Västerås? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i västerås",
        "bästa skolan i västerås",
        "skolranking västerås",
        "grundskola västerås",
        "meritvärde västerås",
        "skolor i västerås",
        "vilken skola är bäst i västerås",
        "västerås skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "helsingborg") {
    return {
      title: `Bästa skolan i Helsingborg 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Helsingborg? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i helsingborg",
        "bästa skolan i helsingborg",
        "skolranking helsingborg",
        "grundskola helsingborg",
        "meritvärde helsingborg",
        "skolor i helsingborg",
        "vilken skola är bäst i helsingborg",
        "helsingborg skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "lund") {
    return {
      title: `Bästa skolan i Lund 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Lund? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i lund",
        "bästa skolan i lund",
        "skolranking lund",
        "grundskola lund",
        "meritvärde lund",
        "skolor i lund",
        "vilken skola är bäst i lund",
        "lund skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "norrkoping") {
    return {
      title: `Bästa skolan i Norrköping 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Norrköping? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i norrköping",
        "bästa skolan i norrköping",
        "skolranking norrköping",
        "grundskola norrköping",
        "meritvärde norrköping",
        "skolor i norrköping",
        "vilken skola är bäst i norrköping",
        "norrköping skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "orebro") {
    return {
      title: `Bästa skolan i Örebro 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Örebro? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i örebro",
        "bästa skolan i örebro",
        "skolranking örebro",
        "grundskola örebro",
        "meritvärde örebro",
        "skolor i örebro",
        "vilken skola är bäst i örebro",
        "örebro skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "jonkoping") {
    return {
      title: `Bästa skolan i Jönköping 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Jönköping? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i jönköping",
        "bästa skolan i jönköping",
        "skolranking jönköping",
        "grundskola jönköping",
        "meritvärde jönköping",
        "skolor i jönköping",
        "vilken skola är bäst i jönköping",
        "jönköping skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "umea") {
    return {
      title: `Bästa skolan i Umeå 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Umeå? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i umeå",
        "bästa skolan i umeå",
        "skolranking umeå",
        "grundskola umeå",
        "meritvärde umeå",
        "skolor i umeå",
        "vilken skola är bäst i umeå",
        "umeå skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "gavle") {
    return {
      title: `Bästa skolan i Gävle 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Gävle? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i gävle",
        "bästa skolan i gävle",
        "skolranking gävle",
        "grundskola gävle",
        "meritvärde gävle",
        "skolor i gävle",
        "vilken skola är bäst i gävle",
        "gävle skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "boras") {
    return {
      title: `Bästa skolan i Borås 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Borås? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i borås",
        "bästa skolan i borås",
        "skolranking borås",
        "grundskola borås",
        "meritvärde borås",
        "skolor i borås",
        "vilken skola är bäst i borås",
        "borås skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "sodertalje") {
    return {
      title: `Bästa skolan i Södertälje 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Södertälje? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i södertälje",
        "bästa skolan i södertälje",
        "skolranking södertälje",
        "grundskola södertälje",
        "meritvärde södertälje",
        "skolor i södertälje",
        "vilken skola är bäst i södertälje",
        "södertälje skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  if (slug === "eskilstuna") {
    return {
      title: `Bästa skolan i Eskilstuna 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i Eskilstuna? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        "bästa grundskolan i eskilstuna",
        "bästa skolan i eskilstuna",
        "skolranking eskilstuna",
        "grundskola eskilstuna",
        "meritvärde eskilstuna",
        "skolor i eskilstuna",
        "vilken skola är bäst i eskilstuna",
        "eskilstuna skolranking",
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  const enhancedCities: Record<string, string> = {
    huddinge: "Huddinge",
    nacka: "Nacka",
    halmstad: "Halmstad",
    sundsvall: "Sundsvall",
    jarfalla: "Järfälla",
    taby: "Täby",
    haninge: "Haninge",
    lulea: "Luleå",
    ostersund: "Östersund",
    botkyrka: "Botkyrka",
    skelleftea: "Skellefteå",
    karlstad: "Karlstad",
    vaxjo: "Växjö",
    kristianstad: "Kristianstad",
    kalmar: "Kalmar",
    falun: "Falun",
    nykoping: "Nyköping",
    molndal: "Mölndal",
    uddevalla: "Uddevalla",
    karlskrona: "Karlskrona",
  };

  if (enhancedCities[slug]) {
    const cityName = enhancedCities[slug];
    const cityNameLower = cityName.toLowerCase();
    return {
      title: `Bästa skolan i ${cityName} 2025 - Fullständig skolranking`,
      description: `Vilken är bästa skolan i ${cityName}? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
      keywords: [
        `bästa grundskolan i ${cityNameLower}`,
        `bästa skolan i ${cityNameLower}`,
        `skolranking ${cityNameLower}`,
        `grundskola ${cityNameLower}`,
        `meritvärde ${cityNameLower}`,
        `skolor i ${cityNameLower}`,
        `vilken skola är bäst i ${cityNameLower}`,
        `${cityNameLower} skolranking`,
      ],
      alternates: {
        canonical: `/kommun/${slug}`,
      },
    };
  }

  return {
    title: `Bästa skolan i ${municipality} 2025 - Fullständig skolranking`,
    description: `Vilken är bästa skolan i ${municipality}? Jämför alla ${schools.length} grundskolor. Nr 1: ${sorted[0].name} (meritvärde ${sorted[0].meritValue.toFixed(1)}). Se meritvärden, SALSA-ranking och välj rätt skola för ditt barn.`,
    keywords: [
      `bästa skola ${municipality}`,
      `skolranking ${municipality}`,
      `grundskola ${municipality}`,
      `meritvärde ${municipality}`,
      `skolor i ${municipality}`,
    ],
    alternates: {
      canonical: `/kommun/${slug}`,
    },
  };
}

export default async function MunicipalityPage({ params }: Props) {
  const { name: slug } = await params;
  const schools = getSchoolsByMunicipalitySlug(slug);
  if (schools.length === 0) notFound();

  const municipality = schools[0].municipality;
  const sorted = [...schools].sort((a, b) => a.rank - b.rank);
  const avg = (schools.reduce((s, c) => s + c.meritValue, 0) / schools.length).toFixed(1);
  const total = getAllSchools().length;

  // Enhanced content for Sweden's largest cities
  const isGothenburg = slug === "goteborg";
  const isStockholm = slug === "stockholm";
  const isMalmo = slug === "malmo";
  const isTrollhattan = slug === "trollhattan";
  const isLidingo = slug === "lidingo";
  const isSollentuna = slug === "sollentuna";
  const isUppsala = slug === "uppsala";
  const isLinkoping = slug === "linkoping";
  const isVasteras = slug === "vasteras";
  const isHelsingborg = slug === "helsingborg";
  const isLund = slug === "lund";
  const isNorrkoping = slug === "norrkoping";
  const isOrebro = slug === "orebro";
  const isJonkoping = slug === "jonkoping";
  const isUmea = slug === "umea";
  const isGavle = slug === "gavle";
  const isBoras = slug === "boras";
  const isSodertälje = slug === "sodertalje";
  const isEskilstuna = slug === "eskilstuna";
  const newEnhancedSlugs = new Set([
    "huddinge","nacka","halmstad","sundsvall","jarfalla","taby","haninge",
    "lulea","ostersund","botkyrka","skelleftea","karlstad","vaxjo",
    "kristianstad","kalmar","falun","nykoping","molndal","uddevalla","karlskrona",
  ]);
  const isEnhanced = isGothenburg || isStockholm || isMalmo || isTrollhattan || isLidingo || isSollentuna || isUppsala || isLinkoping || isVasteras || isHelsingborg || isLund || isNorrkoping || isOrebro || isJonkoping || isUmea || isGavle || isBoras || isSodertälje || isEskilstuna || newEnhancedSlugs.has(slug);
  const top5 = sorted.slice(0, 5);

  // SALSA data
  const salsaSchools = getSalsaForMunicipality(slug);

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
          Bästa skolan i {municipality} - Skolranking 2025
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {sorted.length} skolor &middot; Genomsnittligt meritvärde: {avg}
        </p>

        {isEnhanced && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Vilken är bästa skolan i {municipality}?
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3 text-sm leading-relaxed">
              <p>
                {municipality} har totalt {sorted.length} grundskolor med registrerade meritvärden.
                De högst rankade skolorna i {municipality} inkluderar <strong>{top5[0].name}</strong> (meritvärde {top5[0].meritValue.toFixed(1)}),
                följt av <strong>{top5[1].name}</strong> ({top5[1].meritValue.toFixed(1)}) och <strong>{top5[2].name}</strong> ({top5[2].meritValue.toFixed(1)}).
              </p>
              <p>
                Många av de bäst rankade skolorna i {municipality} är enskilda (fristående) skolor, men staden har också flera
                kommunala skolor med höga meritvärden. Det genomsnittliga meritvärdet för {municipality}s grundskolor är {avg},
                vilket är {parseFloat(avg) > 220 ? "något högre" : "nära"} det nationella genomsnittet.
              </p>
              <p>
                När du väljer skola i {municipality} är det viktigt att titta på mer än bara meritvärde. Överväg faktorer som
                närhet till hemmet, skolans profil och inriktning, samt barnets individuella behov. Besök gärna skolorna
                och prata med lärare och elever innan du bestämmer dig.
              </p>
            </div>
          </section>
        )}

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

        {/* SALSA Rankings */}
        {salsaSchools.length > 0 && (
          <section className="mt-12" id="salsa">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              SALSA-ranking i {municipality}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-2xl">
              SALSA justerar meritvärden baserat på socioekonomiska faktorer (t.ex. föräldrars utbildningsnivå,
              andel nyanlända). Positiv avvikelse betyder att eleverna presterar bättre än förväntat.
              Data från Kolada (SALSA) {salsaSchools[0]?.salsa.year}.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Skola</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Meritvärde</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">Förväntat</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300">SALSA-avvikelse</th>
                  </tr>
                </thead>
                <tbody>
                  {salsaSchools.map(({ school: s, salsa }, i) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-gray-900/50">
                      <td className="py-3 px-2 font-bold text-gray-400">{i + 1}</td>
                      <td className="py-3 px-2">
                        <Link href={`/skola/${s.slug}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{s.meritValue.toFixed(1)}</td>
                      <td className="py-3 px-2 text-gray-500">{salsa.expected !== null ? salsa.expected.toFixed(1) : "—"}</td>
                      <td className={`py-3 px-2 font-bold ${
                        (salsa.deviation ?? 0) > 0
                          ? "text-green-600 dark:text-green-400"
                          : (salsa.deviation ?? 0) < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-500"
                      }`}>
                        {salsa.deviation !== null
                          ? `${salsa.deviation > 0 ? "+" : ""}${salsa.deviation.toFixed(1)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {isEnhanced && (
          <section className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Vanliga frågor om skolor i {municipality}
            </h2>
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Vilka är de bästa skolorna i {municipality}?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Enligt meritvärde 2025 är {top5[0].name} den högst rankade grundskolan i {municipality} med meritvärde {top5[0].meritValue.toFixed(1)}.
                  Andra topprankade skolor inkluderar {top5[1].name} ({top5[1].meritValue.toFixed(1)}) och {top5[2].name} ({top5[2].meritValue.toFixed(1)}).
                  Kom ihåg att "bäst" kan betyda olika saker för olika familjer -- meritvärde är bara en del av bilden.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Hur rankas skolor i {municipality}?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Denna ranking baseras på genomsnittligt meritvärde -- summan av elevernas slutbetyg i årskurs 9.
                  Data kommer från Skolverket och uppdateras årligen. Meritvärdet påverkas av många faktorer,
                  inklusive socioekonomisk bakgrund och skolans resurser.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Vilket område i {municipality} har de bästa skolorna?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Högpresterande skolor finns spridda över hela {municipality}, från centrum till förorterna.
                  Det finns både kommunala och fristående alternativ i de flesta stadsdelar. Använd tabellen ovan
                  för att se meritvärden och adresser för alla skolor i staden.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Kommunal eller fristående skola i {municipality}?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {municipality} har både kommunala och fristående (enskilda) skolor med höga meritvärden.
                  Bland topp 10 finns en blandning av båda typer. Fristående skolor har ofta specifika profiler
                  (språk, musik, Montessori, etc.), medan kommunala skolor följer den allmänna läroplanen.
                  Välj baserat på vad som passar ditt barns behov bäst.
                </p>
              </div>
            </div>
          </section>
        )}
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
            "@type": "ItemList",
            name: `Grundskolor i ${municipality}`,
            description: `Ranking av ${sorted.length} grundskolor i ${municipality} efter meritvärde`,
            numberOfItems: sorted.length,
            itemListElement: sorted.slice(0, 10).map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "School",
                name: s.name,
                url: `https://skolranking.com/skola/${s.slug}`,
              },
            })),
          }),
        }}
      />

      {isEnhanced && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: `Vilka är de bästa skolorna i ${municipality}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Enligt meritvärde 2025 är ${top5[0].name} den högst rankade grundskolan i ${municipality} med meritvärde ${top5[0].meritValue.toFixed(1)}. Andra topprankade skolor inkluderar ${top5[1].name} (${top5[1].meritValue.toFixed(1)}) och ${top5[2].name} (${top5[2].meritValue.toFixed(1)}). Kom ihåg att "bäst" kan betyda olika saker för olika familjer -- meritvärde är bara en del av bilden.`,
                  },
                },
                {
                  "@type": "Question",
                  name: `Hur rankas skolor i ${municipality}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Denna ranking baseras på genomsnittligt meritvärde -- summan av elevernas slutbetyg i årskurs 9. Data kommer från Skolverket och uppdateras årligen. Meritvärdet påverkas av många faktorer, inklusive socioekonomisk bakgrund och skolans resurser.",
                  },
                },
                {
                  "@type": "Question",
                  name: `Vilket område i ${municipality} har de bästa skolorna?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Högpresterande skolor finns spridda över hela ${municipality}, från centrum till förorterna. Det finns både kommunala och fristående alternativ i de flesta stadsdelar.`,
                  },
                },
                {
                  "@type": "Question",
                  name: `Kommunal eller fristående skola i ${municipality}?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `${municipality} har både kommunala och fristående (enskilda) skolor med höga meritvärden. Bland topp 10 finns en blandning av båda typer. Fristående skolor har ofta specifika profiler (språk, musik, Montessori, etc.), medan kommunala skolor följer den allmänna läroplanen. Välj baserat på vad som passar ditt barns behov bäst.`,
                  },
                },
              ],
            }),
          }}
        />
      )}
    </div>
  );
}
