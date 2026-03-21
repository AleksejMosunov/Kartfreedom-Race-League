 

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

  // Find pilots explicitly registered for this stage via `registrations[]`
  const pilots = await Pilot.find({
    registrations: {
      $elemMatch: {
        stageId: stage._id,
        championshipId: stage.championshipId,
      },
    },
  })
    .select({
      name: 1,
      surname: 1,
      number: 1,
      swsId: 1,
      phone: 1,
      registrations: 1,
    })
    .sort({ number: 1 })
    .lean();

  // Build pilot outputs (compute race membership per pilot) and counts
  const pilotOutputs = pilots
    .map((p) => {
      const regForStage = Array.isArray(p.registrations)
        ? p.registrations.find(
            (r: any) =>
              String(r.championshipId ?? p.championshipId) ===
                String(stage.championshipId) &&
              String(r.stageId) === String(stage._id),
          )
        : undefined;

      if (!regForStage) {
        return null;
      }

      let fr = Boolean(regForStage.firstRace);
      let sr = Boolean(regForStage.secondRace);
      if (
        Array.isArray((regForStage as any).raceIds) &&
        Array.isArray(stage.races)
      ) {
        const rids = ((regForStage as any).raceIds || []).map(String);
        if (stage.races[0] && stage.races[0]._id)
          fr = rids.includes(String(stage.races[0]._id));
        if (stage.races[1] && stage.races[1]._id)
          sr = rids.includes(String(stage.races[1]._id));
      }

      return {
        _id: String(p._id),
        number: p.number,
        name: p.name,
        surname: p.surname,
        swsId: p.swsId || null,
        phone: p.phone || null,
        racesCount: (regForStage ? regForStage.racesCount : undefined) ?? 1,
        firstRace: fr,
        secondRace: sr,
        raceIds: Array.isArray((regForStage as any).raceIds)
          ? (regForStage as any).raceIds.map(String)
          : [],
      };
    })
    .filter(Boolean) as Array<any>;

  const firstCount = pilotOutputs.reduce(
    (acc, p) => acc + (p.firstRace ? 1 : 0),
    0,
  );
  const secondCount = pilotOutputs.reduce(
    (acc, p) => acc + (p.secondRace ? 1 : 0),
    0,
  );
  const total = pilotOutputs.reduce(
    (acc, p) => acc + (p.firstRace || p.secondRace ? 1 : 0),
    0,
  );

  const byRacesCount = { 1: firstCount, 2: secondCount };

  return NextResponse.json({ total, byRacesCount, pilots: pilotOutputs });
}
