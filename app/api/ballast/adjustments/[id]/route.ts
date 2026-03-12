import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PilotBallastAdjustment } from "@/lib/models/PilotBallastAdjustment";
import { requireCurrentChampionship } from "@/lib/championship/current";

interface Params {
  params: Promise<{ id: string }>;
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
  if (current.championshipType === "teams") {
    return NextResponse.json(
      { error: "Доваження доступне лише для Sprint-чемпіонату" },
      { status: 409 },
    );
  }
  const { id } = await params;

  const deleted = await PilotBallastAdjustment.findOneAndDelete({
    _id: id,
    championshipId: current._id,
  }).lean();
  if (!deleted) {
    return NextResponse.json(
      { error: "Adjustment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
