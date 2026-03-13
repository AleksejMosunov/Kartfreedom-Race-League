"use client";

import { useState } from "react";
import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";

interface ChampionshipMeta {
  _id: string;
  name: string;
  championshipType: string;
}

export function MultiChampionshipTabs({
  championships,
}: {
  championships: ChampionshipMeta[];
}) {
  const [activeId, setActiveId] = useState(championships[0]?._id ?? "");

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {championships.map((c) => (
          <button
            key={c._id}
            onClick={() => setActiveId(c._id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${activeId === c._id
                ? "bg-red-600 border-red-600 text-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
          >
            {c.name}
            <span className="ml-2 text-xs opacity-70">
              {c.championshipType === "teams" ? "Endurance" : "Sprint"}
            </span>
          </button>
        ))}
      </div>

      {championships.map((c) =>
        activeId === c._id ? (
          <ChampionshipTable key={c._id} championshipId={c._id} />
        ) : null,
      )}
    </div>
  );
}
