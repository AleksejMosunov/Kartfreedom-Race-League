import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { getPointsByPosition } from "@/lib/utils/championship";

interface Params {
  params: Promise<{ id: string }>;
}

interface ResultInput {
  pilotId: string;
  position: number;
  dnf?: boolean;
  dns?: boolean;
  penaltyPoints?: number;
  penaltyReason?: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const body = await req.json();
  const { results }: { results: ResultInput[] } = body;

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

  const enrichedResults = results.map((r) => {
    const basePoints = r.dnf || r.dns ? 0 : getPointsByPosition(r.position);
    const penaltyPoints = Math.max(0, Number(r.penaltyPoints ?? 0));
    const penaltyReason =
      penaltyPoints > 0 ? (r.penaltyReason ?? "").trim() : "";

    return {
      pilotId: r.pilotId,
      position: r.position,
      points: basePoints - penaltyPoints,
      dnf: r.dnf ?? false,
      dns: r.dns ?? false,
      penaltyPoints,
      penaltyReason,
    };
  });

  const stage = await Stage.findByIdAndUpdate(
    id,
    { results: enrichedResults, isCompleted: true },
    { new: true, runValidators: true },
  )
    .populate("results.pilotId", "name number team avatar")
    .lean();

  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json(stage);
}
