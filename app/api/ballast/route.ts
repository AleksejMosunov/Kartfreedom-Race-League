import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BallastConfig } from "@/lib/models/BallastConfig";
import { PilotBallastAdjustment } from "@/lib/models/PilotBallastAdjustment";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { initialBallastRules } from "@/lib/ballast/defaultConfig";
import {
  calculateBallastSummaries,
  normalizeBallastRules,
} from "@/lib/utils/ballast";
import { BallastRule, Pilot as PilotType, Stage as StageType } from "@/types";

const BALLAST_SLUG = "main";

export async function GET() {
  await connectToDatabase();

  const [pilots, stages, config, adjustments] = await Promise.all([
    Pilot.find().sort({ number: 1 }).lean(),
    Stage.find().sort({ number: 1 }).lean(),
    BallastConfig.findOne({ slug: BALLAST_SLUG }).lean(),
    PilotBallastAdjustment.find().sort({ createdAt: -1 }).lean(),
  ]);

  const rules = normalizeBallastRules(
    (config?.rules as BallastRule[] | undefined) ?? initialBallastRules,
  );
  const summaries = calculateBallastSummaries(
    pilots as unknown as PilotType[],
    stages as unknown as StageType[],
    rules,
    adjustments.map((entry) => ({
      _id: String(entry._id),
      pilotId: String(entry.pilotId),
      kg: Number(entry.kg),
      reason: String(entry.reason),
      createdAt: entry.createdAt?.toISOString(),
    })),
  );

  return NextResponse.json({ rules, summaries });
}
