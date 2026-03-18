import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Pilot as IPilotType } from "@/types";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { isValidUkrPhone, normalizePhone } from "@/lib/utils/phone";
import { AUTH_COOKIE_NAME, isValidAdminSession, getAuthenticatedAdminSession } from "@/lib/auth";
import { logAudit, sanitizeForAudit, getAuditIp } from "@/lib/audit";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(sessionToken);

  let current;
  try {
    const championshipId = req.nextUrl.searchParams.get("championship");
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json([]);
  }

  if (!current) {
    return NextResponse.json([]);
  }

  if (current.championshipType === "teams") {
    const teams = await Team.find({ championshipId: current._id })
      .sort({ number: 1, name: 1 })
      .select(isAdmin ? {} : { phone: 0, __v: 0 })
      .lean();
    const participants = teams.map((team) => {
      const base = {
        _id: String(team._id),
        name: team.name,
        surname: "",
        number: team.number,
        teamIsSolo: team.isSolo,
        teamDrivers: team.drivers ?? [],
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };

      return isAdmin ? { ...base, phone: team.phone } : base;
    });
    return NextResponse.json(participants);
  }

  const pilots = await Pilot.find({ championshipId: current._id })
    .sort({ number: 1 })
    .select(isAdmin ? {} : { phone: 0, __v: 0 })
    .lean();

  if (!pilots.length) {
    return NextResponse.json([]);
  }

  const completedStagesByPilot = await Stage.aggregate<{
    _id: unknown;
    completedStagesCount: number;
  }>([
    {
      $match: {
        championshipId: current._id,
        isCompleted: true,
      },
    },
    { $unwind: "$results" },
    {
      $group: {
        _id: "$results.pilotId",
        completedStagesCount: { $sum: 1 },
      },
    },
  ]);

  const completedStagesMap = new Map(
    completedStagesByPilot.map((entry) => [
      String(entry._id),
      entry.completedStagesCount,
    ]),
  );

  const participants = pilots.map((pilot) => ({
    ...pilot,
    // ensure `league` exists on returned pilot objects (fallback to 'newbie')
    league: (pilot as IPilotType).league ?? "newbie",
    completedStagesCount: completedStagesMap.get(String(pilot._id)) ?? 0,
  }));

  return NextResponse.json(participants);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  let current;
  const championshipId = req.nextUrl.searchParams.get("championship");
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

  if (current.championshipType === "teams") {
    return NextResponse.json(
      {
        error:
          "В Endurance-чемпіонаті учасників додають у розділі 'Керування командами'",
      },
      { status: 409 },
    );
  }

  const body = await req.json();

  // validate league if provided
  if (body.league !== undefined) {
    if (body.league !== "pro" && body.league !== "newbie") {
      return NextResponse.json(
        { error: "Invalid league value" },
        { status: 400 },
      );
    }
  }

  const name =
    typeof body.name === "string" ? normalizeNamePart(body.name) : "";
  const surname =
    typeof body.surname === "string" ? normalizeNamePart(body.surname) : "";
  const number = Number(body.number);
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? normalizePhone(body.phone)
      : "";

  if (
    !isValidNamePart(name) ||
    !isValidNamePart(surname) ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > 999
  ) {
    return NextResponse.json(
      { error: "Name, surname and number (1-999) are required" },
      { status: 400 },
    );
  }

  if (phone && !isValidUkrPhone(phone)) {
    return NextResponse.json(
      { error: "Вкажіть дійсний номер телефону у форматі +380XXXXXXXXX" },
      { status: 400 },
    );
  }

  if (phone) {
    const [duplicatePilot, duplicateTeam] = await Promise.all([
      Pilot.findOne({ championshipId: current._id, phone })
        .select({ _id: 1 })
        .lean(),
      Team.findOne({ championshipId: current._id, phone })
        .select({ _id: 1 })
        .lean(),
    ]);

    if (duplicatePilot || duplicateTeam) {
      return NextResponse.json(
        {
          error:
            "Учасник з таким телефоном вже зареєстрований у цьому чемпіонаті",
        },
        { status: 409 },
      );
    }
  }

  try {
    const defaultLeague =
      current.championshipType === "sprint-pro" ? "pro" : "newbie";
    const pilot = await Pilot.create({
      ...body,
      championshipId: current._id,
      name,
      surname,
      number,
      phone: phone || undefined,
      // if admin didn't provide league, choose sensible default depending on championship type
      league: typeof body.league === "string" ? body.league : defaultLeague,
    });

    try {
      // Resolve admin session for audit
      const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      const session = await getAuthenticatedAdminSession(token);

      let stageInfo: { id: string; title?: string } | null = null;
      const providedStageId = typeof body.stageId === "string" ? body.stageId : undefined;
      if (providedStageId) {
        const s = await Stage.findById(providedStageId).select({ title: 1 }).lean();
        if (s) stageInfo = { id: providedStageId, title: (s as any).title };
      }

      const after = sanitizeForAudit({
        name,
        surname,
        league: typeof body.league === "string" ? body.league : defaultLeague,
        championship: { id: String(current._id), title: (current as any).title },
        stage: stageInfo,
      });

      await logAudit({
        session: session ?? null,
        action: "create",
        entityType: "pilot",
        entityId: String((pilot as any)._id),
        entityLabel: `${name} ${surname}`,
        before: null,
        after,
        ip: getAuditIp(req),
      });
    } catch (err) {
      console.error("Failed to write audit for admin pilot create:", err);
    }

    return NextResponse.json(pilot, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: "Name and surname must contain only letters" },
        { status: 400 },
      );
    }

    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: `Pilot with number ${number} already exists` },
        { status: 409 },
      );
    }
    throw err;
  }
}
