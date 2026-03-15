"use client";

import { useMemo, useState } from "react";
import { useStages } from "@/app/hooks/useStages";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { StageCard } from "@/app/components/stages/StageCard";
import { NoActiveClientGate } from "@/app/components/championship/NoActiveClientGate";
import { StagesGridSkeleton } from "@/app/components/ui/PageSkeletons";
import { getPreferredUiChampionshipId, sortSprintFirst } from "@/lib/utils/uiChampionship";

export default function StagesPage() {
  const { active, isLoading: championshipsLoading, hasLoaded } = useChampionshipsCatalog();
  const activeChampionships = sortSprintFirst(active);
  const [selectedChampionshipIdState, setSelectedChampionshipIdState] = useState("");
  const selectedChampionshipId = useMemo(() => {
    if (
      selectedChampionshipIdState &&
      activeChampionships.some((item) => item._id === selectedChampionshipIdState)
    ) {
      return selectedChampionshipIdState;
    }
    return getPreferredUiChampionshipId(activeChampionships);
  }, [activeChampionships, selectedChampionshipIdState]);
  const shouldFetchStages = Boolean(selectedChampionshipId);
  const { stages, isLoading, error } = useStages(
    selectedChampionshipId || undefined,
    { enabled: shouldFetchStages },
  );

  const isBootstrapping =
    (championshipsLoading && !hasLoaded) ||
    (activeChampionships.length > 0 && !selectedChampionshipId) ||
    (shouldFetchStages && isLoading);

  if (isBootstrapping) {
    return (
      <NoActiveClientGate>
        <StagesGridSkeleton />
      </NoActiveClientGate>
    );
  }

  const upcomingStages = stages
    .filter((stage) => !stage.isCompleted)
    .sort((a, b) => {
      const byDate = new Date(a.date).getTime() - new Date(b.date).getTime();
      return byDate !== 0 ? byDate : a.number - b.number;
    });

  const archivedStages = stages
    .filter((stage) => stage.isCompleted)
    .sort((a, b) => {
      const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
      return byDate !== 0 ? byDate : b.number - a.number;
    });

  return (
    <NoActiveClientGate>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Етапи чемпіонату</h1>
          <p className="text-zinc-400 mt-1">Розклад і результати всіх етапів</p>
        </div>

        {activeChampionships.length > 1 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {activeChampionships.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelectedChampionshipIdState(item._id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${selectedChampionshipId === item._id
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-center py-8">{error}</p>}
        {!error && !stages.length && (
          <p className="text-zinc-500 text-center py-12">Етапи ще не додані.</p>
        )}

        {!error && stages.length > 0 && (
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
                    <StageCard
                      key={stage._id}
                      stage={stage}
                      championshipId={selectedChampionshipId || undefined}
                    />
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
                    <StageCard
                      key={stage._id}
                      stage={stage}
                      championshipId={selectedChampionshipId || undefined}
                    />
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
