import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { requireCurrentChampionship } from "@/lib/championship/current";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  let current;
  try {
    current = await requireCurrentChampionship();
  } catch {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }
  const { id } = await params;
  const stage = await Stage.findOne({ _id: id, championshipId: current._id })
    .populate("results.pilotId", "name surname number team avatar")
    .lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json(stage);
}

export async function PUT(req: NextRequest, { params }: Params) {
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
  const { id } = await params;
  const body = await req.json();
  const stage = await Stage.findOneAndUpdate(
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
  return NextResponse.json(stage);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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
  const { id } = await params;
  const stage = await Stage.findOneAndDelete({
    _id: id,
    championshipId: current._id,
  }).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
