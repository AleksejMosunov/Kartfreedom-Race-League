import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Championship } from "@/lib/models/Championship";
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
  const pilot = await Pilot.findOne({
    _id: id,
    championshipId: current._id,
  }).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  if (isAdmin) {
    return NextResponse.json(pilot);
  }
  const { phone: _phone, ...publicPilot } = pilot as Record<string, unknown>;
  return NextResponse.json(publicPilot);
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

  const pilot = await Pilot.findOneAndUpdate(
    { _id: id, championshipId: current._id },
    body,
    {
      new: true,
      runValidators: true,
    },
  ).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  return NextResponse.json(pilot);
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
  const pilot = await Pilot.findOneAndDelete({
    _id: id,
    championshipId: current._id,
  }).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });

  const pilotRec = pilot as Record<string, unknown>;
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
