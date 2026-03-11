import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";
import { getCurrentChampionship } from "@/lib/championship/current";

export async function GET() {
  await connectToDatabase();
  const current = await getCurrentChampionship();
  if (!current) {
    return NextResponse.json([]);
  }

  const [pilots, stages] = await Promise.all([
    Pilot.find({ championshipId: current._id }).sort({ number: 1 }).lean(),
    Stage.find()
      .where("championshipId")
      .equals(current._id)
      .populate("results.pilotId", "name surname number team avatar")
      .sort({ number: 1 })
      .lean(),
  ]);

  const standings = calculateChampionshipStandings(
    pilots as unknown as IPilotType[],
    stages as unknown as IStageType[],
  );

  return NextResponse.json(standings);
}
