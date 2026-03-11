import Link from "next/link";
import { Pilot } from "@/types";
import { formatPilotFullName } from "@/lib/utils/pilotName";

interface PilotCardProps {
  pilot: Pilot;
  ballastKg?: number;
}

function formatKg(kg: number) {
  return `${kg.toLocaleString("uk-UA", { minimumFractionDigits: Number.isInteger(kg) ? 0 : 1, maximumFractionDigits: 1 })} кг`;
}

export function PilotCard({ pilot, ballastKg = 0 }: PilotCardProps) {
  console.log(pilot);
  const fullName = formatPilotFullName(pilot.name, pilot.surname);

  return (
    <Link href={`/pilots/${pilot._id}`}>
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
          <p className="text-zinc-300 text-xs mt-1">Доваження: {formatKg(ballastKg)}</p>
        </div>
      </div>
    </Link>
  );
}
