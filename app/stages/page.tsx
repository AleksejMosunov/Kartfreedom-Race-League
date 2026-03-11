"use client";

import { useStages } from "@/app/hooks/useStages";
import { StageCard } from "@/app/components/stages/StageCard";
import { Loader } from "@/app/components/ui/Loader";
import { NoActiveClientGate } from "@/app/components/championship/NoActiveClientGate";

export default function StagesPage() {
  const { stages, isLoading, error } = useStages();

  const upcomingStages = stages
    .filter((stage) => !stage.isCompleted)
    .sort((a, b) => a.number - b.number);

  const archivedStages = stages
    .filter((stage) => stage.isCompleted)
    .sort((a, b) => b.number - a.number);

  return (
    <NoActiveClientGate>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Етапи чемпіонату</h1>
          <p className="text-zinc-400 mt-1">Розклад і результати всіх етапів</p>
        </div>
        {isLoading && <Loader />}
        {error && <p className="text-red-400 text-center py-8">{error}</p>}
        {!isLoading && !error && !stages.length && (
          <p className="text-zinc-500 text-center py-12">Етапи ще не додані.</p>
        )}

        {!isLoading && !error && stages.length > 0 && (
          <div className="space-y-10">
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Майбутні етапи</h2>
                <p className="text-zinc-500 text-sm">Етапи, які ще не завершені</p>
              </div>
              {upcomingStages.length === 0 ? (
                <p className="text-zinc-500 text-sm">Немає запланованих етапів.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingStages.map((stage) => (
                    <StageCard key={stage._id} stage={stage} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Архів етапів</h2>
                <p className="text-zinc-500 text-sm">Завершені етапи з результатами</p>
              </div>
              {archivedStages.length === 0 ? (
                <p className="text-zinc-500 text-sm">Архів поки порожній.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivedStages.map((stage) => (
                    <StageCard key={stage._id} stage={stage} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </NoActiveClientGate>
  );
}
