import Link from "next/link";
import { Pilot } from "@/types";

interface PilotCardProps {
  pilot: Pilot;
}

export function PilotCard({ pilot }: PilotCardProps) {
  return (
    <Link href={`/pilots/${pilot._id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-600 transition-colors cursor-pointer flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {pilot.avatar ? (
            <img src={pilot.avatar} alt={pilot.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            `#${pilot.number}`
          )}
        </div>
        <div>
          <p className="font-bold text-white">{pilot.name}</p>
          <p className="text-zinc-600 text-xs font-mono mt-0.5">Номер #{pilot.number}</p>
        </div>
      </div>
    </Link>
  );
}
