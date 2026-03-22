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

  const stages = await Stage.find()
    .where("championshipId")
    .equals(current._id)
    .populate("races.results.pilotId", "name surname number team avatar")
    .sort({ number: 1 })
    .lean();

  const stageIds = (stages as unknown as IStageType[]).map((s) => s._id);

  // Prefer canonical `registrations[]` model: include pilots with per-championship
  // registrations or explicit registrations for any stage in this championship.
  // Also include pilots who appear in stage results but may not have a
  // registration record (results can be added manually). Collect all pilot
  // ids referenced in the stages' races and include them in the query.
  const pilotIdsFromResults = new Set<string>();
  (stages as unknown as any[]).forEach((s) => {
    (s.races ?? []).forEach((r: any) => {
      (r.results ?? []).forEach((res: any) => {
        const id =
          res.pilotId !== null &&
          typeof res.pilotId === "object" &&
          "_id" in res.pilotId
            ? String(res.pilotId._id)
            : String(res.pilotId);
        if (id) pilotIdsFromResults.add(id);
      });
    });
  });

  const participants = await Pilot.find({
    $or: [
      { "registrations.championshipId": current._id },
      { "registrations.stageId": { $in: stageIds } },
      { _id: { $in: Array.from(pilotIdsFromResults) } },
    ],
  })
    .sort({ number: 1 })
    .select(isAdmin ? {} : { phone: 0, __v: 0 })
    .lean();

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

  // log counts after completedStages is computed

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
