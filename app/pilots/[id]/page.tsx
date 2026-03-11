"use client";

import { use } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePilotsStore } from "@/store/pilotsStore";
import { useChampionshipStore } from "@/store/championshipStore";
import { Loader } from "@/app/components/ui/Loader";
import Link from "next/link";
import { PilotBallastSummary } from "@/types";
import { formatPilotFullName } from "@/lib/utils/pilotName";

type ChampionshipType = "solo" | "teams";

function formatKg(kg: number) {
  return `${kg.toLocaleString("uk-UA", { minimumFractionDigits: Number.isInteger(kg) ? 0 : 1, maximumFractionDigits: 1 })} кг`;
}

export default function PilotDetailPage({ params }: { params: Promise<{ id: string; }>; }) {
  const { id } = use(params);
  const { pilots, fetchPilots, isLoading } = usePilotsStore();
  const { standings, fetchStandings } = useChampionshipStore();
  const [ballast, setBallast] = useState<PilotBallastSummary | null>(null);
  const [championshipType, setChampionshipType] = useState<ChampionshipType>("solo");

  useEffect(() => {
    fetchPilots();
    fetchStandings();
  }, [fetchPilots, fetchStandings]);

  useEffect(() => {
    const loadChampionshipType = async () => {
      try {
        const res = await fetch("/api/championships", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          current?: { championshipType?: ChampionshipType } | null;
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
      setBallast(null);
      return;
    }

    const loadBallast = async () => {
      try {
        const res = await fetch("/api/ballast");
        if (!res.ok) return;
        const data = (await res.json()) as { summaries?: PilotBallastSummary[]; };
        const summary = (data.summaries ?? []).find((row) => row.pilotId === id) ?? null;
        setBallast(summary);
      } catch {
        setBallast(null);
      }
    };

    void loadBallast();
  }, [championshipType, id]);

  const hasBallastDetails = useMemo(
    () => Boolean(ballast && (ballast.autoEntries.length > 0 || ballast.manualEntries.length > 0)),
    [ballast],
  );

  const pilot = pilots.find((p) => p._id === id);
  const standing = standings.find((s) => s.pilot._id === id);
  const pilotFullName = pilot ? formatPilotFullName(pilot.name, pilot.surname) : "";
  const isTeams = championshipType === "teams";

  if (isLoading) return <Loader />;
  if (!pilot)
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-400">{isTeams ? "Команду не знайдено." : "Пілота не знайдено."}</p>
        <Link href="/pilots" className="text-red-500 underline mt-4 block">
          ← Назад до {isTeams ? "команд" : "пілотів"}
        </Link>
      </main>
    );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/pilots" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Усі {isTeams ? "команди" : "пілоти"}
      </Link>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
          #{pilot.number}
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{pilotFullName}</h1>
        </div>
        {standing && (
          <div className="ml-auto text-right">
            <p className="text-4xl font-black text-white">{standing.totalPoints}</p>
            <p className="text-zinc-500 text-sm">очок</p>
            <p className="text-zinc-400 text-sm">#{standing.position} у чемпіонаті</p>
            {!isTeams && <p className="text-zinc-300 text-sm mt-2">Доваження: {formatKg(ballast?.totalKg ?? 0)}</p>}
          </div>
        )}
      </div>
      {!isTeams && hasBallastDetails && ballast && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Деталі доваження</h2>
          <p className="text-sm text-zinc-300 mb-4">
            Авто: {formatKg(ballast.autoKg)} · Ручне: {formatKg(ballast.manualKg)} · Разом: {formatKg(ballast.totalKg)}
          </p>
          <div className="space-y-2">
            {ballast.autoEntries.map((entry) => (
              <div key={`${entry.stageId}-${entry.position}`} className="text-sm text-zinc-300 flex justify-between gap-3">
                <span>
                  Етап {entry.stageNumber} ({entry.stageName}) · {entry.position}-е місце
                </span>
                <span>+{formatKg(entry.kg)}</span>
              </div>
            ))}
            {ballast.manualEntries.map((entry) => (
              <div key={entry._id} className="text-sm text-zinc-300 flex justify-between gap-3">
                <span>Ручне: {entry.reason}</span>
                <span>{entry.kg > 0 ? "+" : ""}{formatKg(entry.kg)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {standing && standing.standings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Результати за етапами</h2>
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
                    Етап {s.stageNumber}: {s.stageName}
                  </span>
                  {s.isDropped && (
                    <span className="ml-2 text-xs text-zinc-500">(не враховується)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {s.position && (
                    <span className="text-zinc-400 text-sm">{s.position}-е місце</span>
                  )}
                  <span className={`font-bold text-lg ${s.isDropped ? "text-zinc-600 line-through" : "text-white"}`}>
                    {s.dnf ? "DNF" : s.dns ? "DNS" : `${s.points} очк.`}
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
