import Link from "next/link";
import Image from "next/image";
import { Pilot } from "@/types";
import { formatPilotFullName } from "@/lib/utils/pilotName";

interface PilotCardProps {
  pilot: Pilot;
  championshipId?: string;
}

const passthroughImageLoader = ({ src }: { src: string; }) => src;

export function PilotCard({ pilot, championshipId }: PilotCardProps) {
  const fullName = formatPilotFullName(pilot.name, pilot.surname);
  const numberText = `#${pilot.number}`;
  const hasLongNumber = String(pilot.number).length >= 3;
  const participantStat = pilot.teamDrivers?.length
    ? pilot.teamIsSolo
      ? "Формат: solo-команда"
      : `Пілотів у складі: ${pilot.teamDrivers.length}`
    : typeof pilot.completedStagesCount === "number"
      ? `Завершених етапів: ${pilot.completedStagesCount}`
      : "Новий учасник";
  const href = championshipId
    ? `/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId)}`
    : `/pilots/${pilot._id}`;

  return (
    <Link href={href} className="group block">
      <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.07)_0%,rgba(24,24,27,0.92)_40%,rgba(10,10,12,0.96)_100%)] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ccff00]/40 hover:shadow-[0_22px_50px_-28px_rgba(204,255,0,0.65)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ccff00]/10 blur-2xl transition-opacity duration-300 group-hover:opacity-90" />

        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-[#ccff00] p-[2px] shadow-[0_0_0_1px_rgba(204,255,0,0.22)]">
            <div
              className={`flex h-full w-full items-center justify-center rounded-full bg-black/85 font-black leading-none text-[#ccff00] ${hasLongNumber ? "text-xl" : "text-3xl"}`}
            >
              {pilot.avatar ? (
                <Image
                  src={pilot.avatar}
                  alt={fullName}
                  width={64}
                  height={64}
                  loader={passthroughImageLoader}
                  unoptimized
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                numberText
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
              {fullName}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Учасник #{pilot.number}
            </p>
            <p className="mt-3 text-sm text-zinc-400 transition-colors group-hover:text-zinc-300">
              {participantStat}
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
          <span>Перейти до пілота</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  );
}
