import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PilotBallastAdjustment } from "@/lib/models/PilotBallastAdjustment";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const deleted = await PilotBallastAdjustment.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json(
      { error: "Adjustment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
