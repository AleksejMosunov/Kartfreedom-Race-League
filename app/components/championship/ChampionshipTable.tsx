"use client";

import { useEffect, useState } from "react";
import { useChampionship } from "@/app/hooks/useChampionship";
import { useStages } from "@/app/hooks/useStages";
import { Badge } from "@/app/components/ui/Badge";
import { Loader } from "@/app/components/ui/Loader";
import { POINTS_TABLE } from "@/lib/utils/championship";
import { formatPilotFullName } from "@/lib/utils/pilotName";

const positionMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type ChampionshipType = "solo" | "teams";

export function ChampionshipTable() {
  const { standings, isLoading, error } = useChampionship();
  const { stages } = useStages();
  const [championshipType, setChampionshipType] = useState<ChampionshipType>("solo");

  useEffect(() => {
    const loadType = async () => {
      try {
        const res = await fetch("/api/championships", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          current?: { championshipType?: ChampionshipType; } | null;
        };
        setChampionshipType(data.current?.championshipType === "teams" ? "teams" : "solo");
      } catch {
        setChampionshipType("solo");
      }
    };

    void loadType();
  }, []);

  const completedStages = stages.filter((s) => s.isCompleted);

  if (isLoading) return <Loader />;
  if (error) return <p className="text-red-400 text-center py-8">{error}</p>;
  if (!standings.length)
    return (
      <p className="text-zinc-500 text-center py-12">
        Наразі немає даних. Додайте пілотів і результати етапів.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-zinc-900 text-zinc-400 text-left">
            <th className="px-4 py-3 font-semibold w-12">#</th>
            <th className="px-4 py-3 font-semibold">{championshipType === "teams" ? "Команда" : "Пілот"}</th>
            {completedStages.map((stage) => (
              <th key={stage._id} className="px-3 py-3 font-semibold text-center whitespace-nowrap">
                Ет.{stage.number}
              </th>
            ))}
            <th className="px-4 py-3 font-semibold text-center">Очки</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => (
            <tr
              key={row.pilot._id}
              className={`border-t border-zinc-800 transition-colors hover:bg-zinc-800/50 ${idx === 0 ? "bg-yellow-500/5" : ""
                }`}
            >
              <td className="px-4 py-3 font-bold text-zinc-300">
                {positionMedals[row.position] ?? row.position}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs font-mono w-6">
                    #{row.pilot.number}
                  </span>
                  <span className="font-semibold text-white">
                    {formatPilotFullName(row.pilot.name, row.pilot.surname)}
                  </span>
                </div>
              </td>
              {completedStages.map((stage) => {
                const stageStanding = row.standings.find((s) => String(s.stageId) === String(stage._id));
                const hasPenalty = Boolean(stageStanding && stageStanding.penaltyPoints > 0);
                return (
                  <td key={stage._id} className="px-3 py-3 text-center">
                    {stageStanding ? (
                      <Badge
                        variant={
                          stageStanding.isDropped
                            ? "dropped"
                            : stageStanding.dnf || stageStanding.dns
                              ? "warning"
                              : hasPenalty
                                ? "danger"
                                : "default"
                        }
                        className={hasPenalty ? "cursor-help" : ""}
                        title={
                          hasPenalty
                            ? `Штраф: -${stageStanding.penaltyPoints}. Причина: ${stageStanding.penaltyReason}`
                            : undefined
                        }
                      >
                        {stageStanding.dnf
                          ? "DNF"
                          : stageStanding.dns
                            ? "DNS"
                            : stageStanding.points}
                      </Badge>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center font-bold text-white text-base">
                {row.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800 text-xs text-zinc-500 flex gap-4 flex-wrap">
        <span>
          <Badge variant="dropped">0</Badge> — закреслений етап (найгірший, не враховується)
        </span>
        <span>
          <Badge variant="warning">DNF</Badge> — не фінішував
        </span>
        <span>
          <Badge variant="danger">Штраф</Badge> — штрафні очки віднімаються із загального заліку навіть у drop round
        </span>
        <span>
          Система очок: {Object.entries(POINTS_TABLE).map(([pos, pts]) => `${pos}→${pts}`).join(", ")}
        </span>
      </div>
    </div>
  );
}
