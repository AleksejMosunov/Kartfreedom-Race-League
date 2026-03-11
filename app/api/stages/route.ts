import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { requireCurrentChampionship } from "@/lib/championship/current";

export async function GET() {
  try {
    await connectToDatabase();
    const current = await requireCurrentChampionship();
    const stages = await Stage.find()
      .where("championshipId")
      .equals(current._id)
      .populate("results.pilotId", "name surname number avatar")
      .sort({ number: 1 })
      .lean();
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
