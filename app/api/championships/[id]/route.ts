import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const championship = await Championship.findById(id).lean();
  if (!championship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [pilots, stages] = await Promise.all([
    Pilot.find({ championshipId: id }).sort({ number: 1 }).lean(),
    Stage.find({ championshipId: id })
      .populate("results.pilotId", "name surname number team avatar")
      .sort({ number: 1 })
      .lean(),
  ]);

  const standings = calculateChampionshipStandings(
    pilots as unknown as IPilotType[],
    stages as unknown as IStageType[],
  );

  return NextResponse.json({ championship, pilots, stages, standings });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const championship = await Championship.findById(id).lean();
  if (!championship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (championship.status === "active") {
    return NextResponse.json(
      {
        error: "Не можна видалити активний чемпіонат. Спочатку завершіть його.",
      },
      { status: 409 },
    );
  }

  await Championship.deleteOne({ _id: id });

  return NextResponse.json({ ok: true });
}
