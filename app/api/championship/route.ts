import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";

export async function GET() {
  await connectToDatabase();

  const [pilots, stages] = await Promise.all([
    Pilot.find().sort({ number: 1 }).lean(),
    Stage.find()
      .populate("results.pilotId", "name number team avatar")
      .sort({ number: 1 })
      .lean(),
  ]);

  const standings = calculateChampionshipStandings(
    pilots as unknown as IPilotType[],
    stages as unknown as IStageType[],
  );

  return NextResponse.json(standings);
}
