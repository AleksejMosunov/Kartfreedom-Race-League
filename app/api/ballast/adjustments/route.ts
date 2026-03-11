import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PilotBallastAdjustment } from "@/lib/models/PilotBallastAdjustment";

export async function POST(req: NextRequest) {
  await connectToDatabase();

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
