/* eslint-disable @typescript-eslint/no-explicit-any */

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

  let total = 0;
  let firstCount = 0;
  let secondCount = 0;

  for (const p of pilots) {
    // Prefer registrations[] entries for this championship
    const regsForChamp = Array.isArray(p.registrations)
      ? p.registrations.filter(
          (r: any) =>
            String(r.championshipId ?? p.championshipId) ===
            String(stage.championshipId),
        )
      : [];

    // Only registrations[] entries matching this stage count (query ensures this)
    const regForStage = Array.isArray(p.registrations)
      ? p.registrations.find(
          (r: any) =>
            String(r.championshipId ?? p.championshipId) ===
              String(stage.championshipId) &&
            String(r.stageId) === String(stage._id),
        )
      : undefined;
    if (!regForStage) continue;
    const fr = Boolean(regForStage.firstRace);
    const sr = Boolean(regForStage.secondRace);
    if (fr) firstCount += 1;
    if (sr) secondCount += 1;
    if (fr || sr) total += 1;
  }

  const byRacesCount = { 1: firstCount, 2: secondCount };

  return NextResponse.json({
    total,
    byRacesCount,
    pilots: pilots.map((p) => {
      // derive first/second race flags for this stage from registrations[]
      const regForStage = Array.isArray(p.registrations)
        ? p.registrations.find(
            (r: any) =>
              String(r.championshipId ?? p.championshipId) ===
                String(stage.championshipId) &&
              String(r.stageId) === String(stage._id),
          )
        : undefined;

      return {
        _id: String(p._id),
        number: p.number,
        name: p.name,
        surname: p.surname,
        swsId: p.swsId || null,
        phone: p.phone || null,
        racesCount: (regForStage ? regForStage.racesCount : undefined) ?? 1,
        firstRace: regForStage ? Boolean(regForStage.firstRace) : undefined,
        secondRace: regForStage ? Boolean(regForStage.secondRace) : undefined,
      };
    }),
  });
}
