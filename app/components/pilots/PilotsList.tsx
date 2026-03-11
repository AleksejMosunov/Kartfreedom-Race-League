"use client";

import { useEffect, useState } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { PilotCard } from "@/app/components/pilots/PilotCard";
import { Loader } from "@/app/components/ui/Loader";
import { PilotBallastSummary } from "@/types";

export function PilotsList() {
  const { pilots, isLoading, error } = usePilots();
  const [ballastByPilot, setBallastByPilot] = useState<Record<string, number>>({});

  useEffect(() => {
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
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <p className="text-red-400 text-center py-8">{error}</p>;
  if (!pilots.length)
    return <p className="text-zinc-500 text-center py-12">Пілоти ще не додані.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pilots.map((pilot) => (
        <PilotCard key={pilot._id} pilot={pilot} ballastKg={ballastByPilot[pilot._id] ?? 0} />
      ))}
    </div>
  );
}
