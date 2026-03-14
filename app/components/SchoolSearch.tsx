"use client";

import { useState } from "react";
import SchoolMap from "./SchoolMap";

export default function SchoolSearch({
  schoolsJSON,
  municipalities,
}: {
  schoolsJSON: string;
  municipalities: { name: string; slug: string }[];
}) {
  const [search, setSearch] = useState("");
  const [municipality, setMunicipality] = useState("");

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök skola eller kommun..."
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alla kommuner</option>
          {municipalities.map((m) => (
            <option key={m.slug} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      <SchoolMap
        schoolsJSON={schoolsJSON}
        selectedMunicipality={municipality || undefined}
        searchQuery={search || undefined}
      />
    </div>
  );
}
