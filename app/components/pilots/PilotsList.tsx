"use client";

import { useEffect, useState } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { PilotCard } from "@/app/components/pilots/PilotCard";
import { Loader } from "@/app/components/ui/Loader";
import { PilotBallastSummary } from "@/types";

type ChampionshipType = "solo" | "teams";

export function PilotsList() {
  const { pilots, isLoading, error } = usePilots();
  const [ballastByPilot, setBallastByPilot] = useState<Record<string, number>>({});
  const [championshipType, setChampionshipType] = useState<ChampionshipType>("solo");

  useEffect(() => {
    const loadChampionshipType = async () => {
      try {
        const res = await fetch("/api/championships", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          current?: { championshipType?: ChampionshipType; } | null;
        };
        setChampionshipType(data.current?.championshipType === "teams" ? "teams" : "solo");
      } catch {
        setChampionshipType("solo");
      }
    };

    void loadChampionshipType();
  }, []);

  useEffect(() => {
    if (championshipType === "teams") {
      setBallastByPilot({});
      return;
    }

    const loadBallast = async () => {
      try {
        const res = await fetch("/api/ballast");
        if (!res.ok) return;
        const data = (await res.json()) as { summaries?: PilotBallastSummary[]; };
        const nextMap = (data.summaries ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.pilotId] = row.totalKg;
          return acc;
        }, {});
        setBallastByPilot(nextMap);
      } catch {
        setBallastByPilot({});
      }
    };

    void loadBallast();
  }, [championshipType]);

  if (isLoading) return <Loader />;
  if (error) return <p className="text-red-400 text-center py-8">{error}</p>;
  if (!pilots.length)
    return (
      <p className="text-zinc-500 text-center py-12">
        {championshipType === "teams" ? "Команди ще не додані." : "Пілоти ще не додані."}
      </p>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pilots.map((pilot) => (
        <PilotCard
          key={pilot._id}
          pilot={pilot}
          ballastKg={ballastByPilot[pilot._id] ?? 0}
          showBallast={championshipType !== "teams"}
        />
      ))}
    </div>
  );
}
