import { ChampionshipStanding, Pilot, Stage, PilotStanding } from "@/types";

// Points per position (F1-style for karting)
export const POINTS_TABLE: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

export function getPointsByPosition(
  position: number,
  league?: "pro" | "newbie",
): number {
  const base = POINTS_TABLE[position] ?? 0;
  const multiplier = league === "pro" ? 2 : 1;
  return base * multiplier;
}

/**
 * Calculates full championship standings.
 * Sprint (solo): the 2 worst stage results are dropped.
 * Endurance (teams): the 1 worst stage result is dropped.
 * Penalties are always counted in total, even if a stage is dropped.
 */
export function calculateChampionshipStandings(
  pilots: Pilot[],
  stages: Stage[],
  championshipType: "sprint" | "sprint-pro" = "sprint",
): ChampionshipStanding[] {
  const completedStages = stages.filter((s) => s.isCompleted);
  const dropsCount = championshipType === "sprint" ? 2 : 1;

  const standings: ChampionshipStanding[] = pilots.map((pilot) => {
    // For sprint stages with two races we aggregate per-pilot results across races
    const pilotStandings: PilotStanding[] = completedStages.map((stage) => {
      const pilotIdStr = String(pilot._id);

      // collect any results for this pilot across all races
      const perRaceResults = (stage as unknown as any).races
        ? (stage as any).races.flatMap((race: any) =>
            (race.results ?? []).filter((r: any) => {
              const rId =
                r.pilotId !== null &&
                typeof r.pilotId === "object" &&
                "_id" in (r.pilotId as object)
                  ? String((r.pilotId as { _id: unknown })._id)
                  : String(r.pilotId);
              return rId === pilotIdStr;
            }),
          )
        : [];

      if (perRaceResults.length === 0) {
        return {
          stageId: stage._id,
          stageName: stage.name,
          stageNumber: stage.number,
          points: 0,
          position: null,
          isDropped: false,
          dnf: false,
          dns: false,
          penaltyPoints: 0,
          penaltyReason: "",
        };
      }

      const totalPoints = perRaceResults.reduce(
        (s: number, r: any) => s + (r.points || 0),
        0,
      );
      const bestPosition = perRaceResults
        .map((r: any) =>
          typeof r.position === "number" ? r.position : Infinity,
        )
        .reduce((a: number, b: number) => Math.min(a, b), Infinity);
      const allDnf = perRaceResults.every((r: any) => Boolean(r.dnf));
      const allDns = perRaceResults.every((r: any) => Boolean(r.dns));
      const totalPenalty = perRaceResults.reduce(
        (s: number, r: any) => s + (r.penaltyPoints || 0),
        0,
      );
      const penaltyReason =
        perRaceResults.map((r: any) => r.penaltyReason).find(Boolean) || "";

      return {
        stageId: stage._id,
        stageName: stage.name,
        stageNumber: stage.number,
        points: totalPoints,
        position: isFinite(bestPosition) ? bestPosition : null,
        isDropped: false,
        dnf: allDnf,
        dns: allDns,
        penaltyPoints: totalPenalty,
        penaltyReason: penaltyReason,
      };
    });

    // Mark the N worst stages as dropped (only when pilot has more stages than dropsCount)
    if (pilotStandings.length > dropsCount) {
      const sortedByPoints = pilotStandings
        .map((s, i) => ({ points: s.points, index: i }))
        .sort((a, b) => a.points - b.points);

      for (let d = 0; d < dropsCount; d++) {
        pilotStandings[sortedByPoints[d].index].isDropped = true;
      }
    }

    const nonDroppedPoints = pilotStandings
      .filter((s) => !s.isDropped)
      .reduce((sum, s) => sum + s.points, 0);

    const droppedPenalties = pilotStandings
      .filter((s) => s.isDropped)
      .reduce((sum, s) => sum + s.penaltyPoints, 0);

    // Penalty points from dropped rounds still reduce the championship total.
    const totalPoints = nonDroppedPoints - droppedPenalties;

    return {
      pilot,
      totalPoints,
      bestPoints: totalPoints,
      stagesCount: pilotStandings.filter((s) => s.position !== null).length,
      standings: pilotStandings,
      position: 0, // will be set after sorting
    };
  });

  // Sort by total points descending
  standings.sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign positions
  standings.forEach((s, i) => {
    s.position = i + 1;
  });

  return standings;
}
