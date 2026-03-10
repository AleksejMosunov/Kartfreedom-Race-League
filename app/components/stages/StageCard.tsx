import Link from "next/link";
import { Stage } from "@/types";
import { Badge } from "@/app/components/ui/Badge";

interface StageCardProps {
  stage: Stage;
}

export function StageCard({ stage }: StageCardProps) {
  const date = new Date(stage.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link href={`/stages/${stage._id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-600 transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 font-mono">Этап {stage.number}</span>
          <Badge variant={stage.isCompleted ? "success" : "warning"}>
            {stage.isCompleted ? "Завершён" : "Ожидается"}
          </Badge>
        </div>
        <h3 className="text-white font-bold text-lg leading-tight">{stage.name}</h3>
        <p className="text-zinc-500 text-xs mt-2">{date}</p>
        {stage.isCompleted && (
          <p className="text-zinc-500 text-xs mt-2">
            Участников: {stage.results.length}
          </p>
        )}
      </div>
    </Link>
  );
}
