import {
  BallastRule,
  Pilot,
  PilotAutoBallastEntry,
  PilotBallastAdjustment,
  PilotBallastSummary,
  Stage,
} from "@/types";

function toId(value: unknown): string {
  if (
    value !== null &&
    typeof value === "object" &&
    "_id" in (value as object)
  ) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export const defaultBallastRules: BallastRule[] = [
  { position: 1, kg: 5 },
  { position: 2, kg: 2.5 },
];

export function normalizeBallastRules(rules: BallastRule[]): BallastRule[] {
  return rules
    .map((rule) => ({
      position: Math.max(1, Math.floor(Number(rule.position))),
      kg: Number(rule.kg),
    }))
    .filter(
      (rule) => Number.isFinite(rule.position) && Number.isFinite(rule.kg),
    )
    .sort((a, b) => a.position - b.position);
}

export function calculateBallastSummaries(
  pilots: Pilot[],
  stages: Stage[],
  rules: BallastRule[],
  manualAdjustments: PilotBallastAdjustment[],
): PilotBallastSummary[] {
  const ruleMap = new Map<number, number>();
  normalizeBallastRules(rules).forEach((rule) => {
    ruleMap.set(rule.position, rule.kg);
  });

  const completedStages = stages
    .filter((stage) => stage.isCompleted)
    .sort((a, b) => a.number - b.number);

  return pilots.map((pilot) => {
    const autoEntries: PilotAutoBallastEntry[] = [];

    completedStages.forEach((stage) => {
      const result = stage.results.find(
        (row) => toId(row.pilotId) === String(pilot._id),
      );
      if (!result) return;

      const kg = ruleMap.get(result.position);
      if (kg === undefined || kg === 0) return;

      autoEntries.push({
        stageId: String(stage._id),
        stageName: stage.name,
        stageNumber: stage.number,
        position: result.position,
        kg,
      });
    });

    const manualEntries = manualAdjustments.filter(
      (entry) => String(entry.pilotId) === String(pilot._id),
    );

    const autoKg = autoEntries.reduce((sum, entry) => sum + entry.kg, 0);
    const manualKg = manualEntries.reduce((sum, entry) => sum + entry.kg, 0);

    return {
      pilotId: String(pilot._id),
      autoKg,
      manualKg,
      totalKg: autoKg + manualKg,
      autoEntries,
      manualEntries,
    };
  });
}
