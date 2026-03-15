import Link from "next/link";
import { Stage } from "@/types";
import { Badge } from "@/app/components/ui/Badge";

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

  const participantsCount = stage.results.length;
  const dnfCount = stage.results.filter((result) => result.dnf).length;

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

        <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3">
          {stage.isCompleted ? (
            <>
              <div className="rounded-lg bg-zinc-900/70 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Учасників</p>
                <p className="mt-1 text-sm font-semibold text-white">{participantsCount}</p>
              </div>
              <div className="rounded-lg bg-zinc-900/70 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">DNF</p>
                <p className="mt-1 text-sm font-semibold text-white">{dnfCount}</p>
              </div>
            </>
          ) : (
            <div className="col-span-2 rounded-lg bg-zinc-900/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">До старту</p>
              <p className="mt-1 text-sm font-semibold text-white">{countdownLabel}</p>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
