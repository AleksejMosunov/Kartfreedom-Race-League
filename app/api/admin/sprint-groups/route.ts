import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SprintGroup } from "@/lib/models/SprintGroup";
import { Stage } from "@/lib/models/Stage";
import { Pilot } from "@/lib/models/Pilot";
import { Championship } from "@/lib/models/Championship";
import { AUTH_COOKIE_NAME, isValidAdminSession } from "@/lib/auth";
import mongoose from "mongoose";
import type { IStageResult } from "@/lib/models/Stage";

type Body = {
  stageId: string;
  groupsCount: number;
  pilotIds: string[];
  dnsPilotIds?: string[];
};

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(sessionToken);
  if (!isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body || typeof body.stageId !== "string") {
    return NextResponse.json({ error: "stageId is required" }, { status: 400 });
  }

  const stage = await Stage.findById(body.stageId).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const championship = await Championship.findById(stage.championshipId).lean();
  if (!championship)
    return NextResponse.json(
      { error: "Championship not found" },
      { status: 404 },
    );

  const pilotIds = Array.isArray(body.pilotIds)
    ? [...new Set(body.pilotIds)]
    : [];
  if (pilotIds.length === 0)
    return NextResponse.json({ error: "pilotIds required" }, { status: 400 });

  const groupsCount = Number(body.groupsCount) || 1;
  if (!Number.isInteger(groupsCount) || groupsCount < 1) {
    return NextResponse.json({ error: "Invalid groupsCount" }, { status: 400 });
  }

  // validate pilot ids belong to championship
  const pilots = await Pilot.find({
    _id: { $in: pilotIds.map((id) => id) },
    championshipId: championship._id,
  }).lean();
  const foundPilotIds = new Set(pilots.map((p) => String(p._id)));
  const filteredPilotIds = pilotIds.filter((id) => foundPilotIds.has(id));
  // remove DNS pilots from grouping (they should not be assigned to any group)
  const dnsPilotIds = Array.isArray(body.dnsPilotIds)
    ? [...new Set(body.dnsPilotIds)]
    : [];
  const dnsSet = new Set(dnsPilotIds.map(String));
  const availablePilotIds = filteredPilotIds.filter(
    (id) => !dnsSet.has(String(id)),
  );
  if (availablePilotIds.length === 0)
    return NextResponse.json(
      { error: "No valid pilots provided" },
      { status: 400 },
    );

  // shuffle pilots to produce random groups (Fisher-Yates)
  for (let i = availablePilotIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = availablePilotIds[i];
    availablePilotIds[i] = availablePilotIds[j];
    availablePilotIds[j] = tmp;
  }

  // balance distribution
  const n = availablePilotIds.length;
  const base = Math.floor(n / groupsCount);
  let extra = n % groupsCount;
  const groups: { groupNumber: number; pilotIds: string[] }[] = [];
  let cursor = 0;
  for (let i = 0; i < groupsCount; i++) {
    const size = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    const groupPilotIds = availablePilotIds.slice(cursor, cursor + size);
    cursor += size;
    if (groupPilotIds.length)
      groups.push({ groupNumber: i + 1, pilotIds: groupPilotIds });
  }

  // persist groups
  const created: {
    _id: mongoose.Types.ObjectId;
    stageId: mongoose.Types.ObjectId;
    groupNumber: number;
    pilotIds: mongoose.Types.ObjectId[];
  }[] = [];
  for (const g of groups) {
    const doc = await SprintGroup.create({
      championshipId: championship._id,
      stageId: stage._id,
      groupNumber: g.groupNumber,
      pilotIds: g.pilotIds,
    });
    created.push(doc);
  }

  // mark DNS pilots in stage results
  if (dnsPilotIds.length > 0) {
    const stageDoc = await Stage.findById(body.stageId);
    if (stageDoc) {
      for (const pid of dnsPilotIds) {
        const exists = stageDoc.results.find(
          (r: IStageResult) => String(r.pilotId) === pid,
        );
        if (exists) {
          exists.dns = true;
        } else {
          // Add a new result record; cast to IStageResult after creating ObjectId
          stageDoc.results.push({
            pilotId: new mongoose.Types.ObjectId(pid),
            position: 0,
            points: 0,
            dnf: false,
            dns: true,
            penaltyPoints: 0,
            penaltyReason: "",
          } as IStageResult);
        }
      }
      await stageDoc.save();
    }
  }

  return NextResponse.json({
    groups: created.map((c) => ({
      _id: String(c._id),
      stageId: String(c.stageId),
      groupNumber: c.groupNumber,
      pilotIds: c.pilotIds.map(String),
    })),
  });
}

export async function DELETE(req: NextRequest) {
  await connectToDatabase();

  const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(sessionToken);
  if (!isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stageId = req.nextUrl.searchParams.get("stageId");
  if (!stageId)
    return NextResponse.json({ error: "stageId is required" }, { status: 400 });

  const stage = await Stage.findById(stageId).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  // delete sprint groups for the stage
  await SprintGroup.deleteMany({ stageId: stage._id });

  // optionally clear dns flags if requested
  const clearDns = req.nextUrl.searchParams.get("clearDns");
  if (clearDns === "1" || clearDns === "true") {
    const stageDoc = await Stage.findById(stageId);
    if (stageDoc) {
      let changed = false;
      for (const r of stageDoc.results) {
        if ((r as IStageResult).dns) {
          (r as IStageResult).dns = false;
          changed = true;
        }
      }
      if (changed) await stageDoc.save();
    }
  }

  return NextResponse.json({ ok: true });
}
