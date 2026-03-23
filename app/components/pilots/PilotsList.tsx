"use client";

import { usePilots } from "@/app/hooks/usePilots";
import { PilotCard } from "@/app/components/pilots/PilotCard";
import { Loader } from "@/app/components/ui/Loader";

export function PilotsList({ championshipId, championshipType }: { championshipId?: string; championshipType?: "sprint" | "sprint-pro"; }) {
  const { pilots, isLoading, error } = usePilots(championshipId);
  // keep `championshipType` in the props for callers; mark as used to avoid unused-var warnings
  void championshipType;

  if (isLoading) return <Loader />;
  if (error) return <p className="text-red-400 text-center py-8">{error}</p>;
  if (!pilots.length)
    return (
      <p className="text-zinc-500 text-center py-12">
        Пілоти ще не додані.
      </p>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pilots.map((pilot) => (
        <PilotCard
          key={pilot._id}
          pilot={pilot}
          championshipId={championshipId}
        />
      ))}
    </div>
  );
}
