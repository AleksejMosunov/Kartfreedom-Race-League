import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { logAudit, getAuditIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const championshipId = req.nextUrl.searchParams.get("championship");
    const current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();

    if (!current) {
      return NextResponse.json([]);
    }

    const stages =
      current.championshipType === "teams"
        ? await Stage.find()
            .where("championshipId")
            .equals(current._id)
            .sort({ number: 1 })
            .lean()
        : await Stage.find()
            .where("championshipId")
            .equals(current._id)
            .populate("results.pilotId", "name surname number avatar")
            .sort({ number: 1 })
            .lean();

    if (current.championshipType === "teams") {
      const teams = await Team.find({ championshipId: current._id }).lean();
      const teamById = new Map(teams.map((team) => [String(team._id), team]));

      const mappedStages = stages.map((stage) => ({
        ...stage,
        results: (stage.results ?? []).map(
          (result: Record<string, unknown>) => {
            const id =
              result.pilotId !== null &&
              typeof result.pilotId === "object" &&
              "_id" in (result.pilotId as object)
                ? String((result.pilotId as { _id: unknown })._id)
                : String(result.pilotId);
            const team = teamById.get(id);
            if (!team) return result;
            return {
              ...result,
              pilot: {
                _id: String(team._id),
                name: team.name,
                surname: "",
                number: team.number,
              },
            };
          },
        ),
      }));

      return NextResponse.json(mappedStages);
    }

    return NextResponse.json(stages);
  } catch (err) {
    if ((err as { status?: number }).status === 409) {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: "Failed to load stages" },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();
  let current;
  try {
    current = body.championshipId
      ? await Championship.findById(body.championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }

  if (!current) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }

  try {
    const stage = await Stage.create({ ...body, championshipId: current._id });

    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getAuthenticatedAdminSession(token);
    void logAudit({
      session,
      action: "create",
      entityType: "stage",
      entityId: String(stage._id),
      entityLabel: `Етап ${body.number as string}: ${body.name as string}`,
      after: { number: body.number, name: body.name },
      ip: getAuditIp(req),
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (err) {
    if ((err as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: `Stage with number ${body.number} already exists` },
        { status: 409 },
      );
    }
    throw err;
  }
}
