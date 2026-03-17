import { useState } from "react";
import { Stage } from "@/types";
import { Badge } from "@/app/components/ui/Badge";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { formatPilotFullName } from "@/lib/utils/pilotName";

interface StageResultsTableProps {
  stage: Stage;
}

const positionMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type ChampionshipType = "solo" | "teams" | "sprint-pro";

export function StageResultsTable({ stage }: StageResultsTableProps) {
  const { current } = useChampionshipsCatalog();
  const championshipType: ChampionshipType =
    current?.championshipType === "teams"
      ? "teams"
      : current?.championshipType === "sprint-pro"
        ? "sprint-pro"
        : "solo";
  const [leagueFilter, setLeagueFilter] = useState<"all" | "pro" | "newbie">(
    championshipType === "sprint-pro" ? "pro" : "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "fin" | "dnf" | "dns">("all");
  const [teamFilter, setTeamFilter] = useState("");

  const sorted = [...stage.results].sort((a, b) => a.position - b.position);
  const filtered = sorted.filter((result) => {
    const status = result.dns ? "dns" : result.dnf ? "dnf" : "fin";
    const statusMatch = statusFilter === "all" || statusFilter === status;

    const pilotObj =
      result.pilot ??
      (result.pilotId !== null &&
        typeof result.pilotId === "object" &&
        "name" in (result.pilotId as object)
        ? (result.pilotId as typeof result.pilot)
        : null);
    const title = pilotObj ? formatPilotFullName(pilotObj.name, pilotObj.surname).toLowerCase() : "";
    const number = pilotObj ? String(pilotObj.number) : "";
    const search = teamFilter.trim().toLowerCase();
    const searchMatch = !search || title.includes(search) || number.includes(search);

    // league filtering (only for solo-like championships)
    let leagueMatch = true;
    if (championshipType !== "teams") {
      const pilotLeague = (pilotObj as any)?.league ?? "newbie";
      if (leagueFilter === "pro") leagueMatch = pilotLeague === "pro";
      if (leagueFilter === "newbie") leagueMatch = pilotLeague === "newbie";
    }

    return statusMatch && searchMatch && leagueMatch;
  });

  if (!sorted.length) {
    return <p className="text-zinc-500 text-center py-8">Результати ще не додані.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm text-zinc-300">
          Статус
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "fin" | "dnf" | "dns")}
            className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="all">Усі</option>
            <option value="fin">FIN</option>
            <option value="dnf">DNF</option>
            <option value="dns">DNS</option>
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          {championshipType === "teams" ? "Команда" : "Пілот"}
          <input
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            placeholder="Пошук"
            className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
        </label>
        {championshipType !== "teams" && (
          <label className="text-sm text-zinc-300">
            Залік
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value as "all" | "pro" | "newbie")}
              className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              disabled={championshipType === "sprint-pro"}
            >
              <option value="all">Усі</option>
              <option value="pro">Про</option>
              <option value="newbie">Новачки</option>
            </select>
          </label>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-left">
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold w-16">Місце</th>
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold">{championshipType === "teams" ? "Команда" : "Пілот"}</th>
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold text-center">Статус</th>
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold text-center">Best lap</th>
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold text-center">Штраф</th>
              <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold text-center">Очки</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, idx) => {
              // pilotId may be a populated pilot object or a raw id string
              const pilotObj =
                result.pilot ??
                (result.pilotId !== null &&
                  typeof result.pilotId === "object" &&
                  "name" in (result.pilotId as object)
                  ? (result.pilotId as typeof result.pilot)
                  : null);
              const pilotIdStr =
                pilotObj && "_id" in (pilotObj as object)
                  ? String((pilotObj as { _id: unknown; })._id)
                  : String(result.pilotId);
              return (
                <tr
                  key={pilotIdStr || idx}
                  className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-zinc-300">
                    {positionMedals[result.position] ?? result.position}
                  </td>
                  <td className="px-4 py-3">
                    {pilotObj ? (
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs font-mono w-6">
                          #{pilotObj.number}
                        </span>
                        <span className="font-semibold text-white">
                          {formatPilotFullName(pilotObj.name, pilotObj.surname)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">{pilotIdStr}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {result.dnf ? (
                      <Badge variant="warning">DNF</Badge>
                    ) : result.dns ? (
                      <Badge variant="danger">DNS</Badge>
                    ) : (
                      <Badge variant="success">FIN</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-300 text-xs">
                    {result.bestLap ? (
                      <Badge variant="success">FL +1</Badge>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {result.penaltyPoints ? (
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="danger">-{result.penaltyPoints}</Badge>
                        {result.penaltyReason ? (
                          <span className="text-xs text-zinc-500 max-w-40 truncate" title={result.penaltyReason}>
                            {result.penaltyReason}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">
                    {result.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {filtered.map((result) => {
          const pilotObj =
            result.pilot ??
            (result.pilotId !== null &&
              typeof result.pilotId === "object" &&
              "name" in (result.pilotId as object)
              ? (result.pilotId as typeof result.pilot)
              : null);
          const pilotIdStr = pilotObj && "_id" in (pilotObj as object)
            ? String((pilotObj as { _id: unknown; })._id)
            : String(result.pilotId ?? result._id ?? "");
          const itemKey = result._id ? String(result._id) : `${pilotIdStr}-${result.position}`;
          return (
            <div key={itemKey} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-zinc-400 text-xs">{positionMedals[result.position] ?? result.position} місце</p>
                  <p className="text-white font-semibold">
                    {pilotObj
                      ? `#${pilotObj.number} ${formatPilotFullName(pilotObj.name, pilotObj.surname)}`
                      : String(result.pilotId)}
                  </p>
                </div>
                <p className="text-white font-black">{result.points}</p>
              </div>
              <div className="mt-2 text-xs text-zinc-400 flex items-center justify-between">
                <span>{result.dns ? "DNS" : result.dnf ? "DNF" : "FIN"}</span>
                <span>Best lap: {result.bestLap ? "FL +1" : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
