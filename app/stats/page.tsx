"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader } from "@/app/components/ui/Loader";

type StatsParticipant = {
  participantId: string;
  participantNumber: number;
  participantName: string;
  totalPoints: number;
  averagePosition: number | null;
  stability: number | null;
  fastestLaps: number;
  progress: Array<{ stageId: string; stageNumber: number; points: number; cumulativePoints: number; }>;
  heatmap: Array<{ stageId: string; stageNumber: number; points: number; position: number | null; status: "fin" | "dnf" | "dns" | "none"; }>;
};

type StatsPayload = {
  championshipType: "solo" | "teams";
  participants: StatsParticipant[];
  stageLabels: Array<{ id: string; number: number; name: string; }>;
  headToHead: Array<{ aId: string; bId: string; aName: string; bName: string; aWins: number; bWins: number; ties: number; }>;
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
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Не вдалося завантажити статистику");
        const payload = (await res.json()) as StatsPayload;
        setData(payload);
        if (payload.participants.length >= 2) {
          setAId(payload.participants[0].participantId);
          setBId(payload.participants[1].participantId);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const selectedHeadToHead = useMemo(() => {
    if (!data || !aId || !bId || aId === bId) return null;
    return (
      data.headToHead.find((row) => row.aId === aId && row.bId === bId) ??
      data.headToHead.find((row) => row.aId === bId && row.bId === aId) ??
      null
    );
  }, [data, aId, bId]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Loader />
      </main>
    );
  }

  if (error || !data) {
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
          Прогрес, стабільність, fastest lap, heatmap результатів і head-to-head.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Head-to-head</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <select
            value={aId}
            onChange={(e) => setAId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white"
          >
            {data.participants.map((p) => (
              <option key={p.participantId} value={p.participantId}>
                #{p.participantNumber} {p.participantName}
              </option>
            ))}
          </select>
          <select
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white"
          >
            {data.participants.map((p) => (
              <option key={p.participantId} value={p.participantId}>
                #{p.participantNumber} {p.participantName}
              </option>
            ))}
          </select>
        </div>

        {selectedHeadToHead ? (
          <div className="rounded-lg border border-zinc-800 px-4 py-3 text-zinc-200 text-sm">
            <span className="font-semibold">{selectedHeadToHead.aName}</span> {selectedHeadToHead.aWins}
            {" : "}
            {selectedHeadToHead.bWins} <span className="font-semibold">{selectedHeadToHead.bName}</span>
            {" · Нічиї: "}
            {selectedHeadToHead.ties}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">Оберіть двох різних учасників.</p>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.participants.map((participant) => (
          <article key={participant.participantId} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-zinc-400 text-xs">#{participant.participantNumber}</p>
                <h3 className="text-lg font-bold text-white">{participant.participantName}</h3>
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
