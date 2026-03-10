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
}

export async function POST(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const body = await req.json();
  const { results }: { results: ResultInput[] } = body;

  const enrichedResults = results.map((r) => ({
    pilotId: r.pilotId,
    position: r.position,
    points: r.dnf || r.dns ? 0 : getPointsByPosition(r.position),
    dnf: r.dnf ?? false,
    dns: r.dns ?? false,
  }));

  const stage = await Stage.findByIdAndUpdate(
    id,
    { results: enrichedResults, isCompleted: true },
    { new: true, runValidators: true },
  )
    .populate("results.pilotId", "name number team avatar")
    .lean();

  if (!stage)
    return NextResponse.json({ error: "Этап не найден" }, { status: 404 });
  return NextResponse.json(stage);
}
