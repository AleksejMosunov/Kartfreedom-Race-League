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

export function getPointsByPosition(position: number): number {
  return POINTS_TABLE[position] ?? 0;
}

/**
 * Calculates full championship standings.
 * The worst 1 stage result per pilot is dropped.
 * Penalties are always counted in total, even if a stage is dropped.
 */
export function calculateChampionshipStandings(
  pilots: Pilot[],
  stages: Stage[],
): ChampionshipStanding[] {
  const completedStages = stages.filter((s) => s.isCompleted);

  const standings: ChampionshipStanding[] = pilots.map((pilot) => {
    const pilotStandings: PilotStanding[] = completedStages.map((stage) => {
      const pilotIdStr = String(pilot._id);
      const result = stage.results.find((r) => {
        // pilotId may be a populated object or a raw ObjectId/string
        const rId =
          r.pilotId !== null &&
          typeof r.pilotId === "object" &&
          "_id" in (r.pilotId as object)
            ? String((r.pilotId as { _id: unknown })._id)
            : String(r.pilotId);
        return rId === pilotIdStr;
      });

      return {
        stageId: stage._id,
        stageName: stage.name,
        stageNumber: stage.number,
        points: result ? result.points : 0,
        position: result ? result.position : null,
        isDropped: false,
        dnf: result?.dnf ?? false,
        dns: result?.dns ?? false,
        penaltyPoints: result?.penaltyPoints ?? 0,
        penaltyReason: result?.penaltyReason ?? "",
      };
    });

    // Mark the worst stage as dropped (only if pilot has > 1 completed stage)
    if (pilotStandings.length > 1) {
      let worstIndex = 0;
      let worstPoints = pilotStandings[0].points;

      pilotStandings.forEach((s, i) => {
        if (s.points < worstPoints) {
          worstPoints = s.points;
          worstIndex = i;
        }
      });

      pilotStandings[worstIndex].isDropped = true;
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
