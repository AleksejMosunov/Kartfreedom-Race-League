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
      <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.07)_0%,rgba(24,24,27,0.92)_40%,rgba(10,10,12,0.96)_100%)] p-3 sm:p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ccff00]/40 hover:shadow-[0_14px_36px_-20px_rgba(204,255,0,0.55)]">
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#ccff00]/10 blur-xl transition-opacity duration-300 group-hover:opacity-90" />

        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-[#ccff00] p-[2px] shadow-[0_0_0_1px_rgba(204,255,0,0.22)]">
            <div
              className={`flex h-full w-full items-center justify-center rounded-full bg-black/85 font-black leading-none text-[#ccff00] ${hasLongNumber ? "text-lg" : "text-2xl"}`}
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
            <p className="whitespace-normal text-xl font-black leading-tight text-white sm:text-1xl">
              {fullName}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              {pilot.league === "pro" ? "Про" : "Новачок"}
            </p>
            <p className="mt-2 text-xs text-zinc-400 transition-colors group-hover:text-zinc-300">
              {participantStat}
            </p>
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
          <span>Перейти до пілота</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </article>
    </Link>
  );
}
