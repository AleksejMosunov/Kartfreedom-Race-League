/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Championship } from "@/lib/models/Championship";
import { Stage } from "@/lib/models/Stage";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";
import {
  AUTH_COOKIE_NAME,
  isValidAdminSession,
  getAuthenticatedAdminSession,
} from "@/lib/auth";
import { logAudit, getAuditIp } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const sessionToken = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(sessionToken);
  let current;
  try {
    current = await requireCurrentChampionship();
  } catch {
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  }
  const { id } = await params;
  const pilot = await Pilot.findById(id).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

  // ensure pilot is associated with this championship via top-level field, registrations, or legacy fields
  let isAssociated = false;

  if (String((pilot as any).championshipId) === String(current._id)) {
    isAssociated = true;
  }

  // Check registrations entries for championship or stages that belong to this championship
  if (!isAssociated && Array.isArray((pilot as any).registrations)) {
    if (
      (pilot as any).registrations.some(
        (r: any) =>
          String(r.championshipId ?? (pilot as any).championshipId) ===
          String(current._id),
      )
    ) {
      isAssociated = true;
    } else {
      const regStageIds = (pilot as any).registrations
        .map((r: any) => r.stageId)
        .filter(Boolean);
      if (regStageIds.length > 0) {
        const stageMatch = await Stage.findOne({
          _id: { $in: regStageIds },
          championshipId: current._id,
        }).lean();
        if (stageMatch) isAssociated = true;
      }
    }
  }

  // Legacy: check registeredStageIds only if any of those stages belong to this championship
  // (legacy `registeredStageIds` and single `stageId` checks removed)

  if (!isAssociated)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  if (isAdmin) {
    return NextResponse.json(pilot);
  }
  const copy = { ...(pilot as Record<string, unknown>) };
  if (Object.prototype.hasOwnProperty.call(copy, "phone")) delete copy.phone;
  return NextResponse.json(copy);
}

export async function PUT(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const championshipId = req.nextUrl.searchParams.get("championship");
  let current;
  try {
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }
  const { id } = await params;
  const body = await req.json();

  if (typeof body.name === "string") {
    const normalizedName = normalizeNamePart(body.name);
    if (!isValidNamePart(normalizedName)) {
      return NextResponse.json(
        { error: "Name must contain only letters" },
        { status: 400 },
      );
    }
    body.name = normalizedName;
  }

  if (typeof body.surname === "string") {
    const normalizedSurname = normalizeNamePart(body.surname);
    if (!isValidNamePart(normalizedSurname)) {
      return NextResponse.json(
        { error: "Surname must contain only letters" },
        { status: 400 },
      );
    }
    body.surname = normalizedSurname;
  }

  if (body.league !== undefined) {
    if (body.league !== "pro" && body.league !== "newbie") {
      return NextResponse.json(
        { error: "Invalid league value" },
        { status: 400 },
      );
    }
  }

  if (body.number !== undefined) {
    const normalizedNumber = Number(body.number);
    if (
      !Number.isInteger(normalizedNumber) ||
      normalizedNumber < 1 ||
      normalizedNumber > 999
    ) {
      return NextResponse.json(
        { error: "Number must be an integer from 1 to 999" },
        { status: 400 },
      );
    }
    body.number = normalizedNumber;
  }

  const pilotDoc = await Pilot.findById(id);
  if (!pilotDoc)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

  // Ensure pilot is associated with this championship
  let associated = false;
  if (String(pilotDoc.championshipId) === String(current._id)) {
    associated = true;
  }

  if (!associated && Array.isArray(pilotDoc.registrations)) {
    if (
      pilotDoc.registrations.some(
        (r: any) =>
          String(r.championshipId ?? pilotDoc.championshipId) ===
          String(current._id),
      )
    ) {
      associated = true;
    } else {
      const regStageIds = pilotDoc.registrations
        .map((r: any) => r.stageId)
        .filter(Boolean);
      if (regStageIds.length > 0) {
        const stageMatch = await Stage.findOne({
          _id: { $in: regStageIds },
          championshipId: current._id,
        }).lean();
        if (stageMatch) associated = true;
      }
    }
  }
  // (legacy `registeredStageIds` and single `stageId` checks removed)

  if (!associated)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

  // Apply updates
  // Prevent accidental overwrite of top-level championship association via admin edits
  if (body && typeof body === "object") {
    // strip legacy top-level championshipId from admin-provided body
    // migrations and per-championship association should live in `registrations[]`
    // so we don't allow writing `championshipId` directly here.
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (body as Record<string, unknown>).championshipId;
  }

  Object.assign(pilotDoc, body);
  try {
    const saved = await pilotDoc.save();
    return NextResponse.json(saved);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Conflict updating pilot" },
        { status: 409 },
      );
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const championshipId = _req.nextUrl.searchParams.get("championship");
  let current;
  try {
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }
  const { id } = await params;
  const pilotDoc = await Pilot.findById(id);
  if (!pilotDoc)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

  // If pilot has registrations for multiple championships, remove registrations for this championship only
  const regs = Array.isArray(pilotDoc.registrations)
    ? pilotDoc.registrations
    : [];
  const beforeCount = regs.length;
  pilotDoc.registrations = regs.filter(
    (r: any) =>
      String(r.championshipId ?? pilotDoc.championshipId) !==
      String(current._id),
  );
  const afterCount = pilotDoc.registrations.length;

  if (afterCount < beforeCount) {
    await pilotDoc.save();
    const token = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getAuthenticatedAdminSession(token);
    void logAudit({
      session,
      action: "update",
      entityType: "pilot",
      entityId: id,
      entityLabel: `${pilotDoc.name} ${pilotDoc.surname} #${pilotDoc.number}`,
      ip: getAuditIp(_req),
    });
    return NextResponse.json({ success: true });
  }

  // No per-championship registrations removed — if top-level championshipId matches, delete entire document
  if (String(pilotDoc.championshipId) === String(current._id)) {
    const pilotRec = await Pilot.findByIdAndDelete(id).lean();
    if (!pilotRec)
      return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
    const pilotLabel =
      `${pilotRec.name as string} ${pilotRec.surname as string} #${pilotRec.number as number}`.trim();
    const token = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getAuthenticatedAdminSession(token);
    void logAudit({
      session,
      action: "delete",
      entityType: "pilot",
      entityId: id,
      entityLabel: pilotLabel,
      ip: getAuditIp(_req),
      alertMessage: `⚠️ <b>Пілот видалено</b>\n«${pilotLabel}»\nАдмін: ${session?.username ?? "unknown"}`,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Pilot not associated with this championship" },
    { status: 404 },
  );
}
