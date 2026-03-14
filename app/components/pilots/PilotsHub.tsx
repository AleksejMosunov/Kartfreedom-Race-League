"use client";

import { useState } from "react";
import { PilotsList } from "@/app/components/pilots/PilotsList";
import { getPreferredUiChampionshipId } from "@/lib/utils/uiChampionship";

type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: "solo" | "teams";
};

export function PilotsHub({
  active,
}: {
  active: ActiveChampionship[];
}) {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    getPreferredUiChampionshipId(active),
  );

  const selected =
    active.find((item) => item._id === selectedChampionshipId) ??
    active.find((item) => item.championshipType === "solo") ??
    active[0];
  const type = selected?.championshipType ?? "solo";

  return (
    <>
      {active.length > 1 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {active.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => setSelectedChampionshipId(item._id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${selectedChampionshipId === item._id
                ? "bg-red-600 border-red-600 text-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
            >
              {item.name}
              <span className="ml-2 text-xs opacity-70">
                {item.championshipType === "teams" ? "Endurance" : "Sprint"}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{type === "teams" ? "Команди" : "Пілоти"}</h1>
        <p className="text-zinc-400 mt-1">
          {type === "teams" ? "Усі команди-учасники чемпіонату" : "Усі учасники чемпіонату"}
        </p>
      </div>

      <PilotsList
        championshipId={selectedChampionshipId || undefined}
        championshipType={type}
      />
    </>
  );
}
