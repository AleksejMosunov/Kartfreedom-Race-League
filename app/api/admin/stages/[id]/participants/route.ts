import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Pilot } from "@/lib/models/Pilot";
import { AUTH_COOKIE_NAME, isValidAdminSession } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const token = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(token);
  if (!isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const stage = await Stage.findById(id).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  // Find pilots for the same championship who are either assigned to this stage
  // or who did not specify a stage (registered to all stages)
  const pilots = await Pilot.find({
    championshipId: stage.championshipId,
    $or: [
      { stageId: stage._id },
      { stageId: { $exists: false } },
      { stageId: null },
    ],
  })
    .select({
      name: 1,
      surname: 1,
      number: 1,
      swsId: 1,
      phone: 1,
      racesCount: 1,
    })
    .sort({ number: 1 })
    .lean();

  const total = pilots.length;
  const byRacesCount = {
    1: pilots.filter((p) => (p.racesCount ?? 1) === 1).length,
    2: pilots.filter((p) => p.racesCount === 2).length,
  };

  return NextResponse.json({
    total,
    byRacesCount,
    pilots: pilots.map((p) => ({
      _id: String(p._id),
      number: p.number,
      name: p.name,
      surname: p.surname,
      swsId: p.swsId || null,
      phone: p.phone || null,
      racesCount: p.racesCount ?? 1,
    })),
  });
}
