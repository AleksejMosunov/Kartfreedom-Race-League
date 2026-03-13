import Link from "next/link";
import { Pilot } from "@/types";
import { formatPilotFullName } from "@/lib/utils/pilotName";

interface PilotCardProps {
  pilot: Pilot;
  championshipId?: string;
}

export function PilotCard({ pilot, championshipId }: PilotCardProps) {
  const fullName = formatPilotFullName(pilot.name, pilot.surname);
  const href = championshipId
    ? `/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId)}`
    : `/pilots/${pilot._id}`;

  return (
    <Link href={href}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-600 transition-colors cursor-pointer flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {pilot.avatar ? (
            <img src={pilot.avatar} alt={fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            `#${pilot.number}`
          )}
        </div>
        <div>
          <p className="font-bold text-white">{fullName}</p>
          <p className="text-zinc-400 text-xs mt-1">Натисніть для перегляду інформації</p>
        </div>
      </div>
    </Link>
  );
}
