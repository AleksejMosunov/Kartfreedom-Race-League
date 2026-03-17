import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SprintGroup } from "@/lib/models/SprintGroup";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const stageId = segments.length >= 2 ? segments[segments.length - 2] : null;
  if (!stageId)
    return NextResponse.json({ error: "Stage id required" }, { status: 400 });

  const stage = await Stage.findById(stageId).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const groups = await SprintGroup.find({ stageId: stage._id })
    .sort({ groupNumber: 1 })
    .lean();

  // fetch pilots details
  const allPilotIds = groups.flatMap((g) => g.pilotIds.map(String));
  const pilots = allPilotIds.length
    ? await Pilot.find({ _id: { $in: allPilotIds } })
        .select({ name: 1, surname: 1, number: 1 })
        .lean()
    : [];
  const pilotMap = new Map(pilots.map((p) => [String(p._id), p]));

  const result = groups.map((g) => ({
    _id: String(g._id),
    groupNumber: g.groupNumber,
    pilots: g.pilotIds.map((pid: any) => {
      const p = pilotMap.get(String(pid));
      return p
        ? {
            _id: String(pid),
            number: p.number,
            name: p.name,
            surname: p.surname,
          }
        : { _id: String(pid) };
    }),
  }));

  return NextResponse.json(result);
}
