"use client";

import { use } from "react";
import { useStage } from "@/app/hooks/useStages";
import { StageResultsTable } from "@/app/components/stages/StageResultsTable";
import { Loader } from "@/app/components/ui/Loader";
import { Badge } from "@/app/components/ui/Badge";
import Link from "next/link";

export default function StageDetailPage({ params }: { params: Promise<{ id: string; }>; }) {
  const { id } = use(params);
  const { stage, isLoading, error } = useStage(id);

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
        <p className="text-zinc-400">Этап не найден.</p>
        <Link href="/stages" className="text-red-500 underline mt-4 block">
          ← Назад к этапам
        </Link>
      </main>
    );

  const date = new Date(stage.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/stages" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Все этапы
      </Link>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-zinc-500 text-sm font-mono">Этап {stage.number}</span>
          <Badge variant={stage.isCompleted ? "success" : "warning"}>
            {stage.isCompleted ? "Завершён" : "Ожидается"}
          </Badge>
        </div>
        <h1 className="text-3xl font-black text-white">{stage.name}</h1>
        <p className="text-zinc-500 text-sm mt-1">📅 {date}</p>
      </div>
      <StageResultsTable stage={stage} />
    </main>
  );
}
