import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { getPointsByPosition } from "@/lib/utils/championship";
import { requireCurrentChampionship } from "@/lib/championship/current";

interface Params {
  params: Promise<{ id: string }>;
}

interface ResultInput {
  pilotId: string;
  position: number;
  dnf?: boolean;
  dns?: boolean;
  bestLap?: boolean;
  penaltyPoints?: number;
  penaltyReason?: string;
}

export async function POST(req: NextRequest, { params }: Params) {
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
  const { results }: { results: ResultInput[] } = body;

  if (!current) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: "Results are required" },
      { status: 400 },
    );
  }

  for (const row of results) {
    const penaltyPoints = Math.max(0, Number(row.penaltyPoints ?? 0));
    const penaltyReason = (row.penaltyReason ?? "").trim();
    if (penaltyPoints > 0 && !penaltyReason) {
      return NextResponse.json(
        { error: "Для штрафу потрібно вказати причину" },
        { status: 400 },
      );
    }
  }

  const fastestLapRows = results.filter((row) => Boolean(row.bestLap));
  if (current.fastestLapBonusEnabled && fastestLapRows.length > 1) {
    return NextResponse.json(
      { error: "Best lap може бути лише у одного учасника" },
      { status: 400 },
    );
  }

  const enrichedResults = results.map((r) => {
    const fastestLapBonus =
      current.fastestLapBonusEnabled && r.bestLap && !r.dnf && !r.dns ? 1 : 0;
    const basePoints = r.dnf || r.dns ? 0 : getPointsByPosition(r.position);
    const penaltyPoints = Math.max(0, Number(r.penaltyPoints ?? 0));
    const penaltyReason =
      penaltyPoints > 0 ? (r.penaltyReason ?? "").trim() : "";

    return {
      pilotId: r.pilotId,
      position: r.position,
      points: basePoints + fastestLapBonus - penaltyPoints,
      dnf: r.dnf ?? false,
      dns: r.dns ?? false,
      bestLap: current.fastestLapBonusEnabled ? Boolean(r.bestLap) : false,
      penaltyPoints,
      penaltyReason,
    };
  });

  const stage =
    current.championshipType === "teams"
      ? await Stage.findOneAndUpdate(
          { _id: id, championshipId: current._id },
          { results: enrichedResults, isCompleted: true },
          { new: true, runValidators: true },
        ).lean()
      : await Stage.findOneAndUpdate(
          { _id: id, championshipId: current._id },
          { results: enrichedResults, isCompleted: true },
          { new: true, runValidators: true },
        )
          .populate("results.pilotId", "name surname number team avatar")
          .lean();

  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  if (current.championshipType === "teams") {
    const teams = await Team.find({ championshipId: current._id }).lean();
    const teamById = new Map(teams.map((team) => [String(team._id), team]));
    const mappedStage = {
      ...stage,
      results: (stage.results ?? []).map((result: Record<string, unknown>) => {
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
    };
    return NextResponse.json(mappedStage);
  }

  return NextResponse.json(stage);
}
