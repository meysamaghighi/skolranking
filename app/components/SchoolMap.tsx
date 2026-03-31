"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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

// Ray-casting point-in-polygon test
function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i][0], xi = polygon[i][1];
    const yj = polygon[j][0], xj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Simplify a path by keeping every Nth point (reduces freehand jitter)
function simplifyPath(points: [number, number][], maxPoints: number): [number, number][] {
  if (points.length <= maxPoints) return points;
  const step = points.length / maxPoints;
  const result: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.floor(i * step)]);
  }
  return result;
}

export default function SchoolMap({
  schoolsJSON,
  selectedMunicipality,
  searchQuery,
  onDrawFilter,
}: {
  schoolsJSON: string;
  selectedMunicipality?: string;
  searchQuery?: string;
  onDrawFilter?: (count: number | null) => void;
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [polygon, setPolygon] = useState<[number, number][] | null>(null);

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
    if (polygon && polygon.length >= 3) {
      result = result.filter((s) => pointInPolygon(s.la, s.ln, polygon));
    }
    return result;
  }, [schools, selectedMunicipality, searchQuery, polygon]);

  const merits = schools.map((s) => s.mv);
  const minMerit = Math.min(...merits);
  const maxMerit = Math.max(...merits);

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (onDrawFilter) {
      onDrawFilter(polygon ? filtered.length : null);
    }
  }, [polygon, filtered.length, onDrawFilter]);

  const handlePolygonChange = useCallback((pts: [number, number][] | null) => {
    setPolygon(pts);
  }, []);

  if (!mapLoaded) {
    return <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  return <MapInner schools={filtered} minMerit={minMerit} maxMerit={maxMerit} polygon={polygon} onPolygonChange={handlePolygonChange} />;
}

function MapInner({
  schools,
  minMerit,
  maxMerit,
  polygon,
  onPolygonChange,
}: {
  schools: SchoolData[];
  minMerit: number;
  maxMerit: number;
  polygon: [number, number][] | null;
  onPolygonChange: (pts: [number, number][] | null) => void;
}) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [RL, setRL] = useState<typeof import("react-leaflet") | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    Promise.all([import("leaflet"), import("react-leaflet")]).then(([leaflet, reactLeaflet]) => {
      setL(leaflet);
      setRL(reactLeaflet);
    });
  }, []);

  if (!L || !RL) {
    return <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, Polygon: LeafletPolygon, useMapEvents } = RL;

  const center: [number, number] = schools.length > 0
    ? [schools.reduce((s, c) => s + c.la, 0) / schools.length, schools.reduce((s, c) => s + c.ln, 0) / schools.length]
    : [62.5, 16.5];
  const zoom = schools.length <= 20 ? 10 : 5;

  // Freehand drawing handler
  function FreehandDrawHandler() {
    const map = useMapEvents({
      mousedown(e: { latlng: { lat: number; lng: number }; originalEvent: MouseEvent }) {
        if (!drawMode) return;
        e.originalEvent.preventDefault();
        isDrawingRef.current = true;
        map.dragging.disable();
        setDrawPoints([[e.latlng.lat, e.latlng.lng]]);
      },
      mousemove(e: { latlng: { lat: number; lng: number } }) {
        if (!drawMode || !isDrawingRef.current) return;
        setDrawPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      },
      mouseup() {
        if (!drawMode || !isDrawingRef.current) return;
        isDrawingRef.current = false;
        map.dragging.enable();
        setDrawPoints((prev) => {
          if (prev.length >= 10) {
            const simplified = simplifyPath(prev, 50);
            onPolygonChange(simplified);
            setDrawMode(false);
            return simplified;
          }
          // Too short a draw, ignore
          return [];
        });
      },
    });
    return null;
  }

  const handleStartDraw = () => {
    setDrawMode(true);
    setDrawPoints([]);
    onPolygonChange(null);
  };

  const handleClearDraw = () => {
    setDrawMode(false);
    setDrawPoints([]);
    isDrawingRef.current = false;
    onPolygonChange(null);
  };

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Draw controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {!drawMode && !polygon ? (
          <button
            onClick={handleStartDraw}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Rita omrade pa kartan
          </button>
        ) : drawMode ? (
          <>
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Rita ett omrade genom att halla ner musknappen och dra
            </span>
            <button
              onClick={handleClearDraw}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Avbryt
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              {schools.length} skolor i omradet
            </span>
            <button
              onClick={handleStartDraw}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rita nytt omrade
            </button>
            <button
              onClick={handleClearDraw}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Rensa
            </button>
          </>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        className={`w-full h-[600px] rounded-xl z-0 ${drawMode ? "cursor-crosshair" : ""}`}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FreehandDrawHandler />

        {/* Show freehand drawing preview */}
        {drawMode && drawPoints.length >= 2 && (
          <LeafletPolygon
            positions={drawPoints}
            pathOptions={{ color: "#2563eb", weight: 2, fillOpacity: 0.1, dashArray: "5,5" }}
            interactive={false}
          />
        )}

        {/* Show completed polygon - interactive: false so clicks pass through to markers */}
        {polygon && !drawMode && (
          <LeafletPolygon
            positions={polygon}
            pathOptions={{ color: "#16a34a", weight: 2, fillOpacity: 0.08 }}
            interactive={false}
          />
        )}

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
                <p>Meritvarde: <strong>{s.mv.toFixed(1)}</strong></p>
                <p>Ranking: <strong>#{s.r}</strong> av {1545}</p>
                <p className="text-gray-500">{s.t}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Color legend */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
        <span>Lagt meritvarde</span>
        <div className="flex h-3 w-48 rounded-full overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: getColor(minMerit + (i / 19) * (maxMerit - minMerit), minMerit, maxMerit) }}
            />
          ))}
        </div>
        <span>Hogt meritvarde</span>
      </div>
    </>
  );
}
