"use client";

import { use } from "react";
import { useEffect } from "react";
import { usePilotsStore } from "@/store/pilotsStore";
import { useChampionshipStore } from "@/store/championshipStore";
import { Loader } from "@/app/components/ui/Loader";
import Link from "next/link";

export default function PilotDetailPage({ params }: { params: Promise<{ id: string; }>; }) {
  const { id } = use(params);
  const { pilots, fetchPilots, isLoading } = usePilotsStore();
  const { standings, fetchStandings } = useChampionshipStore();

  useEffect(() => {
    fetchPilots();
    fetchStandings();
  }, [fetchPilots, fetchStandings]);

  const pilot = pilots.find((p) => p._id === id);
  const standing = standings.find((s) => s.pilot._id === id);

  if (isLoading) return <Loader />;
  if (!pilot)
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-400">Пилот не найден.</p>
        <Link href="/pilots" className="text-red-500 underline mt-4 block">
          ← Назад к пилотам
        </Link>
      </main>
    );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/pilots" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Все пилоты
      </Link>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
          #{pilot.number}
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{pilot.name}</h1>
        </div>
        {standing && (
          <div className="ml-auto text-right">
            <p className="text-4xl font-black text-white">{standing.totalPoints}</p>
            <p className="text-zinc-500 text-sm">очков</p>
            <p className="text-zinc-400 text-sm">#{standing.position} в чемпионате</p>
          </div>
        )}
      </div>
      {standing && standing.standings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Результаты по этапам</h2>
          <div className="space-y-2">
            {standing.standings.map((s) => (
              <div
                key={s.stageId}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${s.isDropped
                  ? "border-zinc-800 bg-zinc-900/30 opacity-50"
                  : "border-zinc-800 bg-zinc-900"
                  }`}
              >
                <div>
                  <span className="font-semibold text-white">
                    Этап {s.stageNumber}: {s.stageName}
                  </span>
                  {s.isDropped && (
                    <span className="ml-2 text-xs text-zinc-500">(не учитывается)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {s.position && (
                    <span className="text-zinc-400 text-sm">{s.position}-е место</span>
                  )}
                  <span className={`font-bold text-lg ${s.isDropped ? "text-zinc-600 line-through" : "text-white"}`}>
                    {s.dnf ? "DNF" : s.dns ? "DNS" : `${s.points} оч.`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
