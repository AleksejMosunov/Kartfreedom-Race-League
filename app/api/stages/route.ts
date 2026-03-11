import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { requireCurrentChampionship } from "@/lib/championship/current";

export async function GET() {
  try {
    await connectToDatabase();
    const current = await requireCurrentChampionship();
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
        results: (stage.results ?? []).map((result) => {
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
        }),
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
  let current;
  try {
    current = await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  const body = await req.json();
  try {
    const stage = await Stage.create({ ...body, championshipId: current._id });
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
