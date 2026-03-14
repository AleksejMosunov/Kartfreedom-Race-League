"use client";

import { useEffect, useState } from "react";
import { useChampionship } from "@/app/hooks/useChampionship";
import { useStages } from "@/app/hooks/useStages";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { Badge } from "@/app/components/ui/Badge";
import { Loader } from "@/app/components/ui/Loader";
import { POINTS_TABLE } from "@/lib/utils/championship";
import { formatPilotFullName } from "@/lib/utils/pilotName";

const positionMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type ChampionshipType = "solo" | "teams";

export function ChampionshipTable({
  championshipId,
  championshipType: propChampionshipType,
}: {
  championshipId?: string;
  championshipType?: "solo" | "teams";
}) {
  const { standings, isLoading, error } = useChampionship(championshipId);
  const { stages } = useStages(championshipId);
  const { current } = useChampionshipsCatalog({ enabled: !championshipId && !propChampionshipType });

  const [championshipTypeById, setChampionshipTypeById] = useState<ChampionshipType>("solo");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<"all" | "top" | "mid" | "tail">("all");
  const [teamFilter, setTeamFilter] = useState("");

  const championshipType: ChampionshipType =
    propChampionshipType ??
    (championshipId
      ? championshipTypeById
      : current?.championshipType === "teams"
        ? "teams"
        : "solo");

  useEffect(() => {
    // prop fully defines the type
    if (propChampionshipType != null) return;
    if (!championshipId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/championships/${championshipId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          championship?: { championshipType?: ChampionshipType; };
        };
        setChampionshipTypeById(
          data.championship?.championshipType === "teams" ? "teams" : "solo",
        );
      } catch {
        setChampionshipTypeById("solo");
      }
    };
    void load();
  }, [championshipId, propChampionshipType]);

  const completedStages = stages.filter((s) => s.isCompleted);
  const normalizedStageFilter =
    stageFilter === "all" || completedStages.some((stage) => stage._id === stageFilter)
      ? stageFilter
      : "all";
  const visibleStages =
    normalizedStageFilter === "all"
      ? completedStages
      : completedStages.filter((stage) => stage._id === normalizedStageFilter);

  const filteredStandings = standings.filter((row) => {
    const search = teamFilter.trim().toLowerCase();
    const name = formatPilotFullName(row.pilot.name, row.pilot.surname).toLowerCase();
    const numberText = String(row.pilot.number);
    const searchMatch = !search || name.includes(search) || numberText.includes(search);

    let classMatch = true;
    if (classFilter === "top") classMatch = row.position <= 3;
    if (classFilter === "mid") classMatch = row.position > 3 && row.position <= 8;
    if (classFilter === "tail") classMatch = row.position > 8;

    return searchMatch && classMatch;
  });

  const trendLabel = (delta?: number) => {
    if (!delta || delta === 0) return <span className="text-zinc-500 text-xs">• без змін</span>;
    if (delta > 0) return <span className="text-emerald-400 text-xs">↑ +{delta}</span>;
    return <span className="text-amber-300 text-xs">↓ {Math.abs(delta)}</span>;
  };

  if (isLoading) return <Loader />;
  if (error) return <p className="text-red-400 text-center py-8">{error}</p>;
  if (!standings.length)
    return (
      <p className="text-zinc-500 text-center py-12">
        Наразі немає даних.
      </p>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-sm text-zinc-300">
          Етап
          <select
            value={normalizedStageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="all">Усі завершені</option>
            {completedStages.map((stage) => (
              <option key={stage._id} value={stage._id}>
                Етап {stage.number}: {stage.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-zinc-300">
          Клас
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value as "all" | "top" | "mid" | "tail")}
            className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="all">Усі</option>
            <option value="top">Top-3</option>
            <option value="mid">Середина таблиці</option>
            <option value="tail">Нижня група</option>
          </select>
        </label>

        <label className="text-sm text-zinc-300">
          {championshipType === "teams" ? "Команда" : "Пілот"}
          <input
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            placeholder="Пошук за ім'ям або номером"
            className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
        </label>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold w-12">#</th>
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold">{championshipType === "teams" ? "Команда" : "Пілот"}</th>
              {visibleStages.map((stage) => (
                <th key={stage._id} className="sticky top-0 z-20 bg-zinc-900 px-3 py-3 font-semibold text-center whitespace-nowrap">
                  Ет.{stage.number}
                </th>
              ))}
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold text-center">Очки</th>
            </tr>
          </thead>
          <tbody>
            {filteredStandings.map((row, idx) => (
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
                    <div>
                      <span className="font-semibold text-white block">
                        {formatPilotFullName(row.pilot.name, row.pilot.surname)}
                      </span>
                      {trendLabel(row.positionDelta)}
                    </div>
                  </div>
                </td>
                {visibleStages.map((stage) => {
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
      </div>

      <div className="md:hidden space-y-2">
        {filteredStandings.map((row) => (
          <div key={row.pilot._id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-zinc-400 text-xs">Позиція {positionMedals[row.position] ?? row.position}</p>
                <p className="text-white font-semibold">
                  #{row.pilot.number} {formatPilotFullName(row.pilot.name, row.pilot.surname)}
                </p>
                {trendLabel(row.positionDelta)}
              </div>
              <p className="text-xl font-black text-white">{row.totalPoints}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {visibleStages.map((stage) => {
                const ss = row.standings.find((s) => String(s.stageId) === String(stage._id));
                return (
                  <div key={stage._id} className="rounded-lg border border-zinc-800 px-2 py-2 text-xs">
                    <p className="text-zinc-500">Ет.{stage.number}</p>
                    <p className="text-white font-semibold mt-1">
                      {ss ? (ss.dnf ? "DNF" : ss.dns ? "DNS" : ss.points) : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
