import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { Championship } from "@/lib/models/Championship";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";
import { getCurrentChampionship } from "@/lib/championship/current";
import { AUTH_COOKIE_NAME, isValidAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(sessionToken);

  const championshipId = req.nextUrl.searchParams.get("championship");
  const current = championshipId
    ? await Championship.findById(championshipId).lean()
    : await getCurrentChampionship();

  if (!current) {
    return NextResponse.json([]);
  }

  const [participants, stages] = await Promise.all([
    Pilot.find({ championshipId: current._id })
      .sort({ number: 1 })
      .select(isAdmin ? {} : { phone: 0, __v: 0 })
      .lean(),
    Stage.find()
      .where("championshipId")
      .equals(current._id)
      .populate("results.pilotId", "name surname number team avatar")
      .sort({ number: 1 })
      .lean(),
  ]);

  // normalize participants so `league` is always present (fallback to 'newbie')
  const normalizedParticipants = (participants as unknown as IPilotType[]).map(
    (p) => ({
      ...(p as IPilotType),
      league: (p as IPilotType).league ?? "newbie",
    }),
  );

  const mappedStages = stages;
  const champType =
    current.championshipType === "sprint-pro" ? "sprint-pro" : "sprint";

  const standings = calculateChampionshipStandings(
    normalizedParticipants,
    mappedStages as unknown as IStageType[],
    champType,
  );

  const completedStages = (mappedStages as unknown as IStageType[])
    .filter((stage) => stage.isCompleted)
    .sort((a, b) => a.number - b.number);

  if (completedStages.length > 1) {
    const previousStages = completedStages.slice(0, -1);
    const previousStandings = calculateChampionshipStandings(
      normalizedParticipants,
      previousStages,
      champType,
    );
    const previousPositionById = new Map(
      previousStandings.map((row) => [String(row.pilot._id), row.position]),
    );

    standings.forEach((row) => {
      const previousPosition = previousPositionById.get(String(row.pilot._id));
      row.positionDelta =
        typeof previousPosition === "number"
          ? previousPosition - row.position
          : 0;
    });
  }

  return NextResponse.json(standings);
}
