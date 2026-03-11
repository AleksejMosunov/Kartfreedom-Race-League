import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PilotBallastAdjustment } from "@/lib/models/PilotBallastAdjustment";
import { requireCurrentChampionship } from "@/lib/championship/current";

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

  if (current.championshipType === "teams") {
    return NextResponse.json(
      { error: "Доваження доступне лише для соло-чемпіонату" },
      { status: 409 },
    );
  }

  const body = (await req.json()) as {
    pilotId?: string;
    kg?: number;
    reason?: string;
  };

  const pilotId = body.pilotId?.trim();
  const reason = body.reason?.trim() ?? "";
  const kg = Number(body.kg);

  if (!pilotId || !Number.isFinite(kg) || !reason) {
    return NextResponse.json(
      { error: "pilotId, kg and reason are required" },
      { status: 400 },
    );
  }

  const created = await PilotBallastAdjustment.create({
    championshipId: current._id,
    pilotId,
    kg,
    reason,
  });

  return NextResponse.json(
    {
      _id: String(created._id),
      pilotId: String(created.pilotId),
      kg: created.kg,
      reason: created.reason,
      createdAt: created.createdAt?.toISOString(),
    },
    { status: 201 },
  );
}
