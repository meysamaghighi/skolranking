"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface SchoolData {
  id: string;
  n: string;   // name
  m: string;   // municipality
  ms: string;  // municipality slug
  mv: number;  // merit value
  t: string;   // school type
  la: number;  // lat
  ln: number;  // lng
  r: number;   // rank
  s: string;   // slug
}

function getColor(merit: number, min: number, max: number): string {
  const ratio = (merit - min) / (max - min);
  // Red (low) -> Yellow (mid) -> Blue (high)
  if (ratio < 0.5) {
    const r = 255;
    const g = Math.round(ratio * 2 * 255);
    const b = 0;
    return `rgb(${r},${g},${b})`;
  } else {
    const r = Math.round((1 - (ratio - 0.5) * 2) * 255);
    const g = Math.round((1 - (ratio - 0.5) * 2) * 200);
    const b = Math.round((ratio - 0.5) * 2 * 255);
    return `rgb(${r},${g},${b})`;
  }
}

export default function SchoolMap({
  schoolsJSON,
  selectedMunicipality,
  searchQuery,
}: {
  schoolsJSON: string;
  selectedMunicipality?: string;
  searchQuery?: string;
}) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const schools: SchoolData[] = useMemo(() => JSON.parse(schoolsJSON), [schoolsJSON]);

  const filtered = useMemo(() => {
    let result = schools;
    if (selectedMunicipality) {
      result = result.filter((s) => s.m === selectedMunicipality);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.n.toLowerCase().includes(q) || s.m.toLowerCase().includes(q)
      );
    }
    return result;
  }, [schools, selectedMunicipality, searchQuery]);

  const merits = schools.map((s) => s.mv);
  const minMerit = Math.min(...merits);
  const maxMerit = Math.max(...merits);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  if (!mapLoaded) {
    return <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  return <MapInner schools={filtered} minMerit={minMerit} maxMerit={maxMerit} />;
}

function MapInner({
  schools,
  minMerit,
  maxMerit,
}: {
  schools: SchoolData[];
  minMerit: number;
  maxMerit: number;
}) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [RL, setRL] = useState<typeof import("react-leaflet") | null>(null);

  useEffect(() => {
    Promise.all([import("leaflet"), import("react-leaflet")]).then(([leaflet, reactLeaflet]) => {
      setL(leaflet);
      setRL(reactLeaflet);
    });
  }, []);

  if (!L || !RL) {
    return <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = RL;

  // Center on Sweden
  const center: [number, number] = schools.length > 0
    ? [schools.reduce((s, c) => s + c.la, 0) / schools.length, schools.reduce((s, c) => s + c.ln, 0) / schools.length]
    : [62.5, 16.5];
  const zoom = schools.length <= 20 ? 10 : 5;

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-[600px] rounded-xl z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {schools.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.la, s.ln]}
            radius={6}
            fillColor={getColor(s.mv, minMerit, maxMerit)}
            color="#333"
            weight={1}
            fillOpacity={0.85}
          >
            <Popup>
              <div className="text-sm">
                <Link href={`/skola/${s.s}`} className="font-bold text-blue-600 hover:underline">
                  {s.n}
                </Link>
                <p className="mt-1">{s.m}</p>
                <p>Meritvärde: <strong>{s.mv.toFixed(1)}</strong></p>
                <p>Ranking: <strong>#{s.r}</strong> av {1545}</p>
                <p className="text-gray-500">{s.t}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Color legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
        <span>Lågt meritvärde</span>
        <div className="flex h-3 w-48 rounded-full overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: getColor(minMerit + (i / 19) * (maxMerit - minMerit), minMerit, maxMerit) }}
            />
          ))}
        </div>
        <span>Högt meritvärde</span>
      </div>
    </>
  );
}
