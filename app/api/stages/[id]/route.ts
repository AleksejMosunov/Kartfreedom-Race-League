import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { requireCurrentChampionship } from "@/lib/championship/current";

interface Params {
  params: Promise<{ id: string }>;
}

async function mapStageParticipantsForTeams(
  stage: Record<string, unknown>,
  championshipId: string,
) {
  const teams = await Team.find({ championshipId }).lean();
  const teamById = new Map(teams.map((team) => [String(team._id), team]));

  return {
    ...stage,
    results: ((stage.results as Array<Record<string, unknown>>) ?? []).map(
      (result) => {
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
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  let current;
  try {
    const championshipId = _req.nextUrl.searchParams.get("championship");
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }
  const { id } = await params;
  const stage =
    current.championshipType === "teams"
      ? await Stage.findOne({ _id: id, championshipId: current._id }).lean()
      : await Stage.findOne({ _id: id, championshipId: current._id })
          .populate("results.pilotId", "name surname number team avatar")
          .lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  if (current.championshipType === "teams") {
    return NextResponse.json(
      await mapStageParticipantsForTeams(
        stage as unknown as Record<string, unknown>,
        String(current._id),
      ),
    );
  }

  return NextResponse.json(stage);
}

export async function PUT(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  let current;
  try {
    const championshipId = req.nextUrl.searchParams.get("championship");
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  const { id } = await params;
  const body = await req.json();
  const stage =
    current.championshipType === "teams"
      ? await Stage.findOneAndUpdate(
          { _id: id, championshipId: current._id },
          body,
          {
            new: true,
            runValidators: true,
          },
        ).lean()
      : await Stage.findOneAndUpdate(
          { _id: id, championshipId: current._id },
          body,
          {
            new: true,
            runValidators: true,
          },
        )
          .populate("results.pilotId", "name surname number team avatar")
          .lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  if (current.championshipType === "teams") {
    return NextResponse.json(
      await mapStageParticipantsForTeams(
        stage as unknown as Record<string, unknown>,
        String(current._id),
      ),
    );
  }

  return NextResponse.json(stage);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  let current;
  try {
    const championshipId = _req.nextUrl.searchParams.get("championship");
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  const { id } = await params;
  const stage = await Stage.findOneAndDelete({
    _id: id,
    championshipId: current._id,
  }).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
