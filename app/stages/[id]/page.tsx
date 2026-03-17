"use client";

import { use } from "react";
import { useStage } from "@/app/hooks/useStages";
import { StageResultsTable } from "@/app/components/stages/StageResultsTable";
import { Loader, Badge } from "@/app/components/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPilotFullName } from "@/lib/utils/pilotName";

export default function StageDetailPage({ params }: { params: Promise<{ id: string; }>; }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const championshipId = searchParams.get("championship") ?? undefined;
  const { stage, isLoading, error } = useStage(id, championshipId);
  const backHref = championshipId
    ? `/stages?championship=${encodeURIComponent(championshipId)}`
    : "/stages";

  const [groups, setGroups] = useState<{ _id: string; groupNumber: number; pilots: { _id: string; number?: number; name?: string; surname?: string; }[]; }[] | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [participantsCount, setParticipantsCount] = useState<number>(0);

  useEffect(() => {
    // initialize participants count based on stage results until we fetch real participants
    setParticipantsCount(stage?.results?.length ?? 0);
  }, [stage, setParticipantsCount]);

  useEffect(() => {
    let cancelled = false;
    async function fetchGroups() {
      setGroupsLoading(true);
      try {
        const url = `/api/stages/${id}/sprint-groups` + (championshipId ? `?championship=${encodeURIComponent(championshipId)}` : "");
        const res = await fetch(url);
        if (!res.ok) {
          setGroups([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setGroups(data);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    }
    fetchGroups();
    // fetch participants count for championship (fallback to stage.results)
    (async () => {
      let cancelled2 = false;
      try {
        if (!championshipId) return;
        const url = `/api/pilots?championship=${encodeURIComponent(championshipId)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled2 && Array.isArray(data)) setParticipantsCount(data.length);
      } catch {
        // ignore
      }
      return () => { cancelled2 = true; };
    })();
    return () => { cancelled = true; };
  }, [id, championshipId, setParticipantsCount]);

  if (isLoading) return <Loader />;
  if (error)
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  if (!stage)
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-400">Етап не знайдено.</p>
        <Link href={backHref} className="text-red-500 underline mt-4 block">
          ← Назад до етапів
        </Link>
      </main>
    );

  const date = new Date(stage.date).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stageDate = new Date(stage.date);
  const now = new Date();
  const stageDay = new Date(
    stageDate.getFullYear(),
    stageDate.getMonth(),
    stageDate.getDate(),
  );
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysToStage = Math.ceil(
    (stageDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  const countdownLabel =
    daysToStage > 1
      ? `${daysToStage} днів`
      : daysToStage === 1
        ? "1 день"
        : daysToStage === 0
          ? "Сьогодні"
          : "Очікуємо результати";



  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href={backHref} className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Усі етапи
      </Link>

      <section className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.08)_0%,rgba(24,24,27,0.92)_40%,rgba(10,10,12,0.98)_100%)] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#ccff00]/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center gap-3 mb-3">
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs font-mono text-zinc-400">
            Етап {stage.number}
          </span>
          <Badge variant={stage.isCompleted ? "success" : "warning"}>
            {stage.isCompleted ? "Завершено" : "Очікується"}
          </Badge>
        </div>

        <h1 className="relative text-4xl font-black tracking-tight text-white sm:text-5xl">
          {stage.name}
        </h1>
        <p className="relative mt-3 text-zinc-400">📅 {date}</p>

        {!stage.isCompleted && (
          <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">До старту</p>
              <p className="mt-1 text-lg font-bold text-white">{countdownLabel}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Учасників</p>
              <p className="mt-1 text-lg font-bold text-white">
                {participantsCount > 0 ? participantsCount : "Немає даних"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Результати</p>
              <p className="mt-1 text-lg font-bold text-white">Очікуються</p>
            </div>
          </div>
        )}
      </section>

      {stage.isCompleted ? (
        <StageResultsTable stage={stage} />
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-6">
          <h2 className="text-xl font-bold text-white">Етап ще триває або очікується</h2>
          <p className="mt-2 text-zinc-400">
            Після завершення етапу тут автоматично зʼявляться результати, позиції, штрафи та best lap.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Повернутися до списку етапів
            </Link>
            <Link
              href="/championship"
              className="inline-flex items-center rounded-lg bg-[#ccff00] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95"
            >
              Подивитися таблицю чемпіонату
            </Link>
          </div>
        </section>
      )}

      {/* Sprint groups display */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-3">Розподіл по групах</h2>
        {groupsLoading && <Loader />}
        {!groupsLoading && groups && groups.length === 0 && (
          <p className="text-zinc-400">Групи ще не сформовано для цього етапу.</p>
        )}
        {!groupsLoading && groups && groups.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {groups.map((g) => (
              <div key={g._id} className="w-full sm:w-auto min-w-[160px] rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <h3 className="text-sm text-zinc-400 mb-2">Група {g.groupNumber}</h3>
                <ul className="text-sm space-y-1">
                  {g.pilots.map((p) => (
                    <li key={p._id} className="text-zinc-200">#{p.number ?? "-"} — {p.name ? formatPilotFullName(p.name, p.surname ?? "") : p._id}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
