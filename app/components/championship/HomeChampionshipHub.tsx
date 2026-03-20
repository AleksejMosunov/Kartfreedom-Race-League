"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
// import { formatPilotFullName } from "@/lib/utils/pilotName";
import { getPreferredUiChampionshipId } from "@/lib/utils/uiChampionship";
import { useStages } from "@/app/hooks/useStages";
import { useChampionship } from "@/app/hooks/useChampionship";
import SponsorsSection from "@/app/components/championship/SponsorsSection";

type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: "sprint" | "sprint-pro";
  prizes?: { place: string; description: string; }[];
};

export function HomeChampionshipHub({
  active,
  preseasonNews,
}: {
  active: ActiveChampionship[];
  preseasonNews: string | { sprint?: string; sprintPro?: string; };
}) {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    getPreferredUiChampionshipId(active),
  );
  const { stages, isLoading: stagesLoading } = useStages(selectedChampionshipId || undefined);
  const { standings, isLoading: standingsLoading } = useChampionship(selectedChampionshipId || undefined);
  const [switching, setSwitching] = useState(false);
  // Show skeleton immediately on initial render until the first fetch completes
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // When user changes selected championship, show skeleton until both hooks finish loading
  useEffect(() => {
    if (!selectedChampionshipId) return;
    setSwitching(true);
  }, [selectedChampionshipId]);

  useEffect(() => {
    if (!switching) return;
    if (!stagesLoading && !standingsLoading) setSwitching(false);
  }, [stagesLoading, standingsLoading, switching]);

  // Consider loading when switching, when either hook is loading, or when
  // we intentionally show the skeleton on initial mount until the first fetch starts and completes.
  const loading = switching || stagesLoading || standingsLoading || showSkeleton;

  useEffect(() => {
    if (stagesLoading || standingsLoading) {
      setHasFetched(true);
      setShowSkeleton(true);
      return;
    }
    if (hasFetched && !stagesLoading && !standingsLoading) {
      setShowSkeleton(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagesLoading, standingsLoading]);
  const selectedChampionship = active.find((c) => c._id === selectedChampionshipId);
  const selectedPreseasonNews =
    typeof preseasonNews === "string"
      ? preseasonNews
      : selectedChampionship?.championshipType === "sprint-pro"
        ? (preseasonNews.sprintPro ?? preseasonNews.sprint ?? "")
        : (preseasonNews.sprint ?? "");

  const nextStage = useMemo(
    () => stages.find((stage) => !stage.isCompleted) ?? null,
    [stages],
  );

  const latestCompleted = useMemo(
    () =>
      [...stages]
        .filter((stage) => stage.isCompleted)
        .sort((a, b) => b.number - a.number)[0] ?? null,
    [stages],
  );
  const leaders = standings.slice(0, 3);
  const isSprint = selectedChampionship?.championshipType === "sprint";
  const newbieLeaders = isSprint
    ? standings.filter((s) => (s.pilot.league ?? "newbie") !== "pro").slice(0, 3)
    : [];
  const proLeaders = isSprint
    ? standings.filter((s) => (s.pilot.league ?? "newbie") === "pro").slice(0, 3)
    : standings.slice(0, 3);
  const prizes = selectedChampionship?.prizes ?? [];
  const hasPrizes = prizes.length > 0;

  if (!active.length) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

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
                {item.championshipType === "sprint-pro" ? "Sprint Pro" : "Sprint"}
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8">
        {loading ? (
          <div className={`grid grid-cols-1 ${hasPrizes ? "md:grid-cols-2 gap-6 md:gap-10" : "gap-0"}`}>
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-40 bg-zinc-800 rounded" />
              <div className="h-8 w-1/2 bg-zinc-800 rounded" />
              <div className="h-4 w-3/4 bg-zinc-800 rounded" />
              <div className="h-9 w-36 bg-zinc-800 rounded mt-3" />
            </div>
            {hasPrizes ? (
              <div className="space-y-3 md:pl-8 pt-3 md:pt-0">
                <div className="h-4 w-32 bg-zinc-800 rounded" />
                <div className="space-y-2">
                  <div className="h-12 bg-zinc-800 rounded" />
                  <div className="h-12 bg-zinc-800 rounded" />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${hasPrizes ? "md:grid-cols-2 gap-6 md:gap-10" : "gap-0"}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-lime-300 mb-2">Наступний етап</p>
              {nextStage ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Етап {nextStage.number}: {nextStage.name}
                  </h2>
                  <p className="text-zinc-300 mt-3">
                    Дата: {new Date(nextStage.date).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/register?championship=${selectedChampionshipId}`}
                      className="inline-flex rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
                    >
                      Зареєструватись
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">Календар оновлюється</h2>
                  <p className="text-zinc-300 mt-3">
                    Нові дати етапів з&apos;являться найближчим часом. Слідкуйте за оновленнями нижче.
                  </p>
                </>
              )}
            </div>

            {hasPrizes ? (
              <div className="border-t border-zinc-800 md:border-t-0 md:border-l md:border-zinc-800 md:pl-8 pt-5 md:pt-0">
                <p className="text-xs uppercase tracking-[0.2em] text-[#ccff00] mb-4">Призовий фонд</p>
                <div className="space-y-2">
                  {prizes.map((prize, i) => (
                    <div key={i} className="flex gap-3 items-center rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2.5">
                      <span className="shrink-0 text-black font-black text-xs bg-[#ccff00] px-2 py-1 rounded min-w-[52px] text-center">
                        {prize.place}
                      </span>
                      <p className="text-zinc-200 text-sm leading-snug">{prize.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {loading ? (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Лідери чемпіонату</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 rounded-lg bg-zinc-800" />
                  <div className="h-12 rounded-lg bg-zinc-800" />
                </div>
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 rounded-lg bg-zinc-800" />
                  <div className="h-12 rounded-lg bg-zinc-800" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white mb-4">Лідери чемпіонату</h3>
              {!latestCompleted ? (
                <p className="text-zinc-500">Поки що немає результатів завершених етапів.</p>
              ) : isSprint ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-400 text-xs mb-2">Новачки</p>
                    <div className="space-y-2">
                      {newbieLeaders.length === 0 ? (
                        <p className="text-zinc-500">Немає учасників</p>
                      ) : (
                        newbieLeaders.map((leader) => (
                          <Link
                            key={leader.pilot._id}
                            href={`/pilots/${leader.pilot._id}?championship=${encodeURIComponent(selectedChampionshipId ?? "")}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                              <div>
                                <p className="text-zinc-400 text-xs">#{leader.position}</p>
                                <div className="text-white font-semibold">
                                  <div className="leading-tight">{leader.pilot.name} {leader.pilot.surname}</div>
                                  {/* <div className="leading-tight"></div> */}
                                </div>
                              </div>
                              <p className="text-white font-black text-xl">{leader.totalPoints}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-zinc-400 text-xs mb-2">Про</p>
                    <div className="space-y-2">
                      {proLeaders.length === 0 ? (
                        <p className="text-zinc-500">Немає учасників</p>
                      ) : (
                        proLeaders.map((leader) => (
                          <Link
                            key={leader.pilot._id}
                            href={`/pilots/${leader.pilot._id}?championship=${encodeURIComponent(selectedChampionshipId ?? "")}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                              <div>
                                <p className="text-zinc-400 text-xs">#{leader.position}</p>
                                <div className="text-white font-semibold">
                                  <div className="leading-tight">{leader.pilot.name} {leader.pilot.surname}</div>
                                  {/* <div className="leading-tight"></div> */}
                                </div>
                              </div>
                              <p className="text-white font-black text-xl">{leader.totalPoints}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaders.map((leader) => (
                    <div
                      key={leader.pilot._id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3"
                    >
                      <div>
                        <p className="text-zinc-400 text-xs">#{leader.position}</p>
                        <div className="text-white font-semibold">
                          <div className="leading-tight">{leader.pilot.name} {leader.pilot.surname}</div>
                        </div>
                      </div>
                      <p className="text-white font-black text-xl">{leader.totalPoints}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          {loading ? (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Останні новини</h3>
              <div className="space-y-3 animate-pulse">
                <div className="h-12 rounded-lg bg-zinc-800" />
                <div className="h-12 rounded-lg bg-zinc-800" />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white mb-4">Останні новини</h3>
              <div className="space-y-3">
                {latestCompleted ? (
                  <Link
                    href={`/stages/${latestCompleted._id}?championship=${encodeURIComponent(selectedChampionshipId ?? "")}`}
                    className="block"
                  >
                    <div className="rounded-lg border border-zinc-800 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider">Завершено</p>
                      <p className="text-white font-semibold mt-1">
                        Етап {latestCompleted.number}: {latestCompleted.name}
                      </p>
                    </div>
                  </Link>
                ) : null}
                {nextStage ? (
                  <div className="rounded-lg border border-zinc-800 px-4 py-3">
                    <p className="text-zinc-400 text-xs uppercase tracking-wider">Анонс</p>
                    <p className="text-white font-semibold mt-1">
                      Реєстрація на етап {nextStage.number} вже відкрита.
                    </p>
                  </div>
                ) : null}
                {selectedPreseasonNews ? (
                  <div className="rounded-lg border border-zinc-800 px-4 py-3">
                    <p className="text-zinc-400 text-xs uppercase tracking-wider">Від організаторів</p>
                    <p className="text-zinc-200 mt-1 whitespace-pre-line">{selectedPreseasonNews}</p>
                  </div>
                ) : (
                  // <p className="text-zinc-500 text-sm">Публічних оголошень наразі немає.</p>
                  ''
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <SponsorsSection />

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-zinc-400 text-sm">Більше деталей та повний залік по чемпіонату</p>
          <p className="text-white font-semibold mt-1">Перейдіть у розділ «Чемпіонат»</p>
        </div>
        <Link
          href="/championship"
          className="inline-flex rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Відкрити чемпіонат
        </Link>
      </div>
    </>
  );
}
