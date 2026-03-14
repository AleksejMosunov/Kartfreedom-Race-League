"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { Stage, ChampionshipStanding } from "@/types";
import { formatPilotFullName } from "@/lib/utils/pilotName";
import { getPreferredUiChampionshipId } from "@/lib/utils/uiChampionship";

type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: "solo" | "teams";
  prizes?: { place: string; description: string; }[];
};

export function HomeChampionshipHub({
  active,
  preseasonNews,
}: {
  active: ActiveChampionship[];
  preseasonNews: string;
}) {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    getPreferredUiChampionshipId(active),
  );
  const [stages, setStages] = useState<Stage[]>([]);
  const [standings, setStandings] = useState<ChampionshipStanding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedChampionshipId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [stagesRes, standingsRes] = await Promise.all([
          fetch(`/api/stages?championship=${encodeURIComponent(selectedChampionshipId)}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/championship?championship=${encodeURIComponent(selectedChampionshipId)}`,
            { cache: "no-store" },
          ),
        ]);

        const stagesData = stagesRes.ok ? ((await stagesRes.json()) as Stage[]) : [];
        const standingsData = standingsRes.ok
          ? ((await standingsRes.json()) as ChampionshipStanding[])
          : [];

        setStages(stagesData);
        setStandings(standingsData);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedChampionshipId]);

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
  const prizes = active.find((c) => c._id === selectedChampionshipId)?.prizes ?? [];

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
                {item.championshipType === "teams" ? "Endurance" : "Sprint"}
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
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
                    href="/register"
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

          <div className="border-t border-zinc-800 md:border-t-0 md:border-l md:border-zinc-700 md:pl-8 pt-5 md:pt-0">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-3">Призовий фонд</p>
            {prizes.length > 0 ? (
              <div className="space-y-3">
                {prizes.map((prize, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 text-white font-bold text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded">
                      {prize.place}
                    </span>
                    <p className="text-zinc-300 text-sm leading-snug">{prize.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Інформацію про призи буде додано найближчим часом.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-xl font-bold text-white mb-4">Лідери чемпіонату</h3>
          {leaders.length === 0 ? (
            <p className="text-zinc-500">Поки що немає результатів завершених етапів.</p>
          ) : (
            <div className="space-y-2">
              {leaders.map((leader) => (
                <div
                  key={leader.pilot._id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3"
                >
                  <div>
                    <p className="text-zinc-400 text-xs">#{leader.position}</p>
                    <p className="text-white font-semibold">
                      #{leader.pilot.number} {formatPilotFullName(leader.pilot.name, leader.pilot.surname)}
                    </p>
                  </div>
                  <p className="text-white font-black text-xl">{leader.totalPoints}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-xl font-bold text-white mb-4">Останні новини</h3>
          <div className="space-y-3">
            {latestCompleted ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Завершено</p>
                <p className="text-white font-semibold mt-1">
                  Етап {latestCompleted.number}: {latestCompleted.name}
                </p>
              </div>
            ) : null}
            {nextStage ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Анонс</p>
                <p className="text-white font-semibold mt-1">
                  Реєстрація на етап {nextStage.number} вже відкрита.
                </p>
              </div>
            ) : null}
            {preseasonNews ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Від організаторів</p>
                <p className="text-zinc-200 mt-1 whitespace-pre-line">{preseasonNews}</p>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Публічних оголошень наразі немає.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">🏆 Таблиця чемпіонату</h1>
        <p className="text-zinc-400 mt-1">
          Загальний залік
        </p>
      </div>

      {loading ? <p className="text-zinc-400">Завантаження...</p> : null}
      <ChampionshipTable championshipId={selectedChampionshipId} />
    </>
  );
}
