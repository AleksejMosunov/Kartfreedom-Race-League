"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { StatsPageSkeleton } from "@/app/components/ui/PageSkeletons";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { getPreferredUiChampionshipId, sortSprintFirst } from "@/lib/utils/uiChampionship";

type StatsParticipant = {
  participantId: string;
  participantNumber: number;
  participantName: string;
  league?: "pro" | "newbie";
  totalPoints: number;
  averagePosition: number | null;
  stability: number | null;
  fastestLaps: number;
  progress: Array<{ stageId: string; stageNumber: number; points: number; cumulativePoints: number; }>;
  heatmap: Array<{ stageId: string; stageNumber: number; points: number; position: number | null; status: "fin" | "dnf" | "dns" | "none"; }>;
};

type StatsPayload = {
  championshipType: "solo" | "teams" | "sprint-pro";
  participants: StatsParticipant[];
  stageLabels: Array<{ id: string; number: number; name: string; }>;
};

function heatClass(status: "fin" | "dnf" | "dns" | "none", points: number) {
  if (status === "dns") return "bg-zinc-800 text-zinc-500";
  if (status === "dnf") return "bg-orange-900/50 text-orange-200";
  if (status === "none") return "bg-zinc-900 text-zinc-600";
  if (points >= 20) return "bg-emerald-700/40 text-emerald-200";
  if (points >= 10) return "bg-lime-700/30 text-lime-200";
  if (points >= 5) return "bg-yellow-700/30 text-yellow-200";
  return "bg-zinc-700/40 text-zinc-200";
}

export default function StatsPage() {
  const {
    active,
    isLoading: championshipsLoading,
    hasLoaded,
  } = useChampionshipsCatalog();
  const activeChampionships = sortSprintFirst(active);
  const [data, setData] = useState<StatsPayload | null>(null);
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
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if ((championshipsLoading && !hasLoaded) || !selectedChampionshipId) {
      setStatsLoading(false);
      setData(null);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    const controller = new AbortController();

    const load = async () => {
      setStatsLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/stats?championship=${encodeURIComponent(selectedChampionshipId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!res.ok) throw new Error("Не вдалося завантажити статистику");
        const payload = (await res.json()) as StatsPayload;
        if (requestIdRef.current !== currentRequestId) return;
        setData(payload);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (requestIdRef.current !== currentRequestId) return;
        setError((err as Error).message);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setStatsLoading(false);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [selectedChampionshipId, championshipsLoading, hasLoaded]);

  const loading = championshipsLoading || statsLoading;

  if (loading) {
    return <StatsPageSkeleton />;
  }

  if (error || !data) {
    if (!selectedChampionshipId && !error) {
      return (
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-zinc-400">Немає активного чемпіонату для статистики.</p>
          <Link href="/" className="text-zinc-300 underline mt-4 block">← На головну</Link>
        </main>
      );
    }

    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || "Статистика недоступна"}</p>
        <Link href="/" className="text-zinc-300 underline mt-4 block">← На головну</Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Поглиблена статистика</h1>
        <p className="text-zinc-400 mt-1">
          Прогрес, стабільність, fastest lap та heatmap результатів.
        </p>
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

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.participants.map((participant) => (
          <article key={participant.participantId} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-zinc-400 text-xs">#{participant.participantNumber}</p>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <span>{participant.participantName}</span>
                  <span className="ml-1 text-xs uppercase text-zinc-400 tracking-wide">{participant.league === "pro" ? "Про" : "Новачок"}</span>
                </h3>
              </div>
              <p className="text-2xl font-black text-white">{participant.totalPoints}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-4">
              <div className="rounded-md border border-zinc-800 px-2 py-2 text-zinc-300">
                <p className="text-zinc-500">Сер. місце</p>
                <p className="font-semibold text-white mt-1">{participant.averagePosition ?? "—"}</p>
              </div>
              <div className="rounded-md border border-zinc-800 px-2 py-2 text-zinc-300">
                <p className="text-zinc-500">Стабільність σ</p>
                <p className="font-semibold text-white mt-1">{participant.stability ?? "—"}</p>
              </div>
              <div className="rounded-md border border-zinc-800 px-2 py-2 text-zinc-300">
                <p className="text-zinc-500">Fastest laps</p>
                <p className="font-semibold text-white mt-1">{participant.fastestLaps}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-zinc-400 text-xs mb-2">Прогрес по етапах</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {participant.progress.map((point) => (
                  <div key={point.stageId} className="rounded-md border border-zinc-800 px-2 py-2 text-xs">
                    <p className="text-zinc-500">Ет.{point.stageNumber}</p>
                    <p className="text-zinc-300 mt-1">+{point.points} очк.</p>
                    <p className="text-white font-semibold">Σ {point.cumulativePoints}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-zinc-400 text-xs mb-2">Heatmap результатів</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {participant.heatmap.map((cell) => (
                  <div
                    key={cell.stageId}
                    className={`rounded-md border border-zinc-800 px-2 py-2 text-xs ${heatClass(cell.status, cell.points)}`}
                    title={`Етап ${cell.stageNumber}: ${cell.status.toUpperCase()} · ${cell.points} очок`}
                  >
                    <p>Ет.{cell.stageNumber}</p>
                    <p className="font-semibold mt-1">{cell.status === "fin" ? cell.points : cell.status.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
