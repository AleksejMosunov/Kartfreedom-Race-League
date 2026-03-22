

import { useState, useEffect } from "react";
import { Stage, Pilot } from "@/types";
import { Badge } from "@/app/components/ui/Badge";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { formatPilotFullName } from "@/lib/utils/pilotName";

interface StageResultsTableProps {
  stage: Stage;
}

const positionMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type ChampionshipType = "sprint" | "sprint-pro";

export function StageResultsTable({ stage }: StageResultsTableProps) {
  // optional: if a championshipId is provided, we'll fetch its type to avoid
  // relying on global catalog state (prevents wrong default when navigating).
  // `stage` may include `championshipId` in some backfills; otherwise caller
  // can pass `championshipId` via props in the future.
  // For now, attempt to read `stage.championshipId` if present.
  const championshipIdFromStage = (stage as any)?.championshipId as string | undefined;
  const [championshipTypeLocal, setChampionshipTypeLocal] = useState<ChampionshipType | null>(null);
  const { current } = useChampionshipsCatalog();
  const championshipType: ChampionshipType =
    current?.championshipType === "sprint-pro"
      ? "sprint-pro"
      : "sprint";
  const [leagueFilter, setLeagueFilter] = useState<"all" | "pro" | "newbie">(
    championshipType === "sprint-pro" ? "pro" : "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "fin" | "dnf" | "dns">("all");
  const [teamFilter, setTeamFilter] = useState("");
  // derive the effective championship type and league filter without
  // forcing setState inside effects (prevents cascading renders)
  const effectiveChampionshipType = championshipTypeLocal ?? championshipType;
  const effectiveLeagueFilter: "all" | "pro" | "newbie" =
    effectiveChampionshipType === "sprint-pro" ? "pro" : leagueFilter;

  const races = (stage as any).races ?? [{ results: (stage as any).results ?? [] }];

  const filteredPerRace = (raceResults: any[]) => {
    const sorted = [...raceResults].sort((a, b) => a.position - b.position);
    return sorted.filter((result) => {
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
      const search = teamFilter.trim().toLowerCase();
      const searchMatch = !search || title.includes(search);

      // league filtering (applies to sprint / sprint-pro championships)
      let leagueMatch = true;
      const pilotLeague = (pilotObj as Pilot | null)?.league ?? "newbie";
      if (effectiveLeagueFilter === "pro") leagueMatch = pilotLeague === "pro";
      if (effectiveLeagueFilter === "newbie") leagueMatch = pilotLeague === "newbie";

      return statusMatch && searchMatch && leagueMatch;
    });
  };



  // If we have a championshipId, prefer fetching its actual type and apply
  // default filters based on that; this avoids inheriting a previously
  // selected global `current` championship when navigating client-side.
  useEffect(() => {
    const id = championshipIdFromStage;
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/championships/${encodeURIComponent(id)}`);
        if (!res.ok) return;
        const body = await res.json();
        if (cancelled) return;
        const t = (body?.championship as Partial<{ championshipType?: ChampionshipType; }>)?.championshipType as ChampionshipType | undefined;
        if (t) setChampionshipTypeLocal(t);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [championshipIdFromStage]);



  const anyResults = races.some((r: any) => (r.results ?? []).length > 0);
  if (!anyResults) {
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
            <option value="all">Загальний</option>
            <option value="fin">FIN</option>
            <option value="dnf">DNF</option>
            <option value="dns">DNS</option>
          </select>
        </label>
        <label className="text-sm text-zinc-300">Пілот
          <input
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            placeholder="Пошук"
            className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
        </label>
        {String(effectiveChampionshipType) !== "sprint-pro" && (
          <label className="text-sm text-zinc-300">
            Залік
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value as "all" | "pro" | "newbie")}
              className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              disabled={String(effectiveChampionshipType) === "sprint-pro"}
            >
              <option value="all">Загальний</option>
              <option value="pro">PRO</option>
              <option value="newbie">ROOKIE</option>
            </select>
          </label>
        )}
      </div>

      {races.map((race: any, raceIdx: number) => {
        const filtered = filteredPerRace(race.results ?? []);
        return (
          <div key={raceIdx} className="mb-6">
            <div className="px-3 py-2 text-zinc-400 text-sm">Гонка {raceIdx + 1}</div>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-400 text-left">
                    <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold w-16">Місце</th>
                    <th className="sticky top-0 z-20 bg-zinc-900 px-4 py-3 font-semibold">Пілот</th>
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
                              {/* initials removed */}
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">{formatPilotFullName(pilotObj.name, pilotObj.surname)}</div>
                                <div className="text-zinc-400 text-xs mt-1">{(pilotObj as Pilot).league === "pro" ? "PRO" : "ROOKIE"}</div>
                              </div>
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
              {filtered.map((result, idx) => {
                const pilotObj =
                  result.pilot ??
                  (result.pilotId !== null &&
                    typeof result.pilotId === "object" &&
                    "name" in (result.pilotId as object)
                    ? (result.pilotId as typeof result.pilot)
                    : null);
                const pilotIdStr = pilotObj && "_id" in (pilotObj as object)
                  ? String((pilotObj as { _id: unknown; })._id)
                  : String(result.pilotId ?? "");
                const itemKey = `${pilotIdStr}-${result.position}-${idx}`;
                return (
                  <div key={itemKey} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-zinc-400 text-xs">{positionMedals[result.position] ?? result.position} місце</p>
                        <p className="text-white font-semibold">
                          {pilotObj ? formatPilotFullName(pilotObj.name, pilotObj.surname) : String(result.pilotId)}
                        </p>
                        {pilotObj ? (
                          <div className="text-zinc-400 text-xs mt-1">{(pilotObj as Pilot).league === "pro" ? "PRO" : "ROOKIE"}</div>
                        ) : null}
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
      })}
    </div>
  );
}
