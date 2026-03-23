import Link from "next/link";
import { Stage } from "@/types";
import { Badge } from "@/app/components/ui/Badge";
import { Pilot } from "@/types";
import { useMemo } from "react";
import { usePilots } from "@/app/hooks/usePilots";

interface StageCardProps {
  stage: Stage;
  championshipId?: string;
}

export function StageCard({ stage, championshipId }: StageCardProps) {
  const stageDate = new Date(stage.date);
  const date = stageDate.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const stageDay = new Date(
    stageDate.getFullYear(),
    stageDate.getMonth(),
    stageDate.getDate(),
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const daysToStage = Math.ceil(
    (stageDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  const { pilots } = usePilots(championshipId);

  const participantsCount = useMemo(() => {
    const ids = ((stage as any).races ?? []).flatMap((r: any) => (r.results ?? []).map((res: any) => {
      if (res.pilot?._id) return String(res.pilot._id);
      if (res.pilotId !== null && typeof res.pilotId === "object" && "_id" in (res.pilotId as object)) return String((res.pilotId as any)._id);
      return String(res.pilotId);
    }));
    const s = new Set(ids.filter(Boolean));
    const base = s.size || 0;

    // derive participants count from centralized pilots store when available
    if (!championshipId) return base;
    if (stage.isCompleted) return base;
    if (!Array.isArray(pilots) || pilots.length === 0) return base;

    const derived = pilots.filter((p: Pilot) => {
      if (!Array.isArray(p.registrations)) return false;
      const regsForChamp = p.registrations.filter((r) =>
        String(r.championshipId ?? p.championshipId) === String(championshipId),
      );
      if (regsForChamp.length === 0) return false;
      const regForStage = regsForChamp.find((r) => String(r.stageId) === String(stage._id));
      if (!regForStage) return false;
      const fr = Boolean(regForStage.firstRace) || (regForStage.racesCount ?? 0) >= 1;
      const sr = Boolean(regForStage.secondRace) || (regForStage.racesCount ?? 0) === 2;
      return fr || sr;
    }).length;

    // prefer the derived count when available
    return derived || base;
  }, [stage, pilots, championshipId]);

  const countdownLabel =
    daysToStage > 1
      ? `${daysToStage} днів`
      : daysToStage === 1
        ? "1 день"
        : daysToStage === 0
          ? "Сьогодні"
          : "Очікуємо результати";

  const href = championshipId
    ? `/stages/${stage._id}?championship=${encodeURIComponent(championshipId)}`
    : `/stages/${stage._id}`;

  return (
    <Link href={href} className="group block">
      <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.07)_0%,rgba(24,24,27,0.92)_40%,rgba(10,10,12,0.96)_100%)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ccff00]/60 hover:shadow-[0_22px_50px_-28px_rgba(204,255,0,0.6)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#ccff00]/10 blur-2xl transition-opacity duration-300 group-hover:opacity-90" />

        <div className="relative mb-3 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-xs font-mono text-zinc-400">
            Етап {stage.number}
          </span>
          <Badge variant={stage.isCompleted ? "success" : "warning"}>
            {stage.isCompleted ? "Завершено" : "Очікується"}
          </Badge>
        </div>

        <h3 className="relative text-2xl font-black leading-tight text-white transition-colors group-hover:text-zinc-100">
          {stage.name}
        </h3>
        <p className="relative mt-2 text-sm text-zinc-400">{date}</p>

        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-zinc-800/80 pt-3">
          <div className="rounded-lg bg-zinc-900/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">До старту</p>
            <p className="mt-1 text-sm font-semibold text-white">{countdownLabel}</p>
          </div>

          <div className="rounded-lg bg-zinc-900/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Учасників</p>
            <p className="mt-1 text-sm font-semibold text-white">{participantsCount && participantsCount > 0 ? participantsCount : "0"}</p>
          </div>

          <div className="rounded-lg bg-zinc-900/70 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Результати</p>
            <p className="mt-1 text-sm font-semibold text-white">{stage.isCompleted ? "Доступні" : "Очікуються"}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}
