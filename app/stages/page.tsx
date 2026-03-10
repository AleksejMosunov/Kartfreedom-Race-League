"use client";

import { useStages } from "@/app/hooks/useStages";
import { StageCard } from "@/app/components/stages/StageCard";
import { Loader } from "@/app/components/ui/Loader";

export default function StagesPage() {
  const { stages, isLoading, error } = useStages();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Этапы чемпионата</h1>
        <p className="text-zinc-400 mt-1">Расписание и результаты всех этапов</p>
      </div>
      {isLoading && <Loader />}
      {error && <p className="text-red-400 text-center py-8">{error}</p>}
      {!isLoading && !error && !stages.length && (
        <p className="text-zinc-500 text-center py-12">Этапы ещё не добавлены.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => (
          <StageCard key={stage._id} stage={stage} />
        ))}
      </div>
    </main>
  );
}
