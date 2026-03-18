import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import { Stage } from "@/lib/models/Stage";
import {
  Stage as IStageType,
  Championship as IChampionshipType,
} from "@/types";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { isValidUkrPhone, normalizePhone } from "@/lib/utils/phone";
import { logAudit, sanitizeForAudit, getAuditIp } from "@/lib/audit";

// Teams/endurance removed from registration flow; helper removed.

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json().catch(() => ({}));

  // validate league if provided; default to 'newbie' on create
  if (body.league !== undefined) {
    if (body.league !== "pro" && body.league !== "newbie") {
      return NextResponse.json(
        { error: "Invalid league value" },
        { status: 400 },
      );
    }
  }

  let current;
  try {
    const championshipId =
      typeof body.championshipId === "string" ? body.championshipId : "";
    current = championshipId
      ? await Championship.findOne({
          _id: championshipId,
          status: "active",
        }).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату. Зверніться до адміністратора." },
      { status: 409 },
    );
  }

  if (!current) {
    return NextResponse.json(
      { error: "Обраний чемпіонат недоступний для реєстрації" },
      { status: 409 },
    );
  }

  // Teams/endurance removed — always handle individual pilot registration below.

  const name =
    typeof body.name === "string" ? normalizeNamePart(body.name) : "";
  const surname =
    typeof body.surname === "string" ? normalizeNamePart(body.surname) : "";
  const number = Number(body.number);
  const phone = normalizePhone(
    typeof body.phone === "string" ? body.phone : "",
  );
  // league handling differs by championship type
  // - for 'sprint-pro' championships league is optional and defaults to 'pro'
  // - for regular 'solo' sprint championships league must be provided (pro|newbie)
  const providedLeague =
    typeof body.league === "string" ? body.league : undefined;
  let leagueToSave: "pro" | "newbie" | undefined;
  if (current.championshipType === "sprint-pro") {
    // accept provided valid league, otherwise default to 'pro'
    if (
      providedLeague &&
      providedLeague !== "pro" &&
      providedLeague !== "newbie"
    ) {
      return NextResponse.json(
        { error: "Невірне значення ліги" },
        { status: 400 },
      );
    }
    leagueToSave = (providedLeague as "pro" | "newbie") ?? "pro";
  } else {
    // existing behavior: league MUST be provided for solo sprint championships
    if (!providedLeague) {
      return NextResponse.json(
        { error: "Вкажіть лігу пілота (pro або newbie)" },
        { status: 400 },
      );
    }
    if (providedLeague !== "pro" && providedLeague !== "newbie") {
      return NextResponse.json(
        { error: "Невірне значення ліги" },
        { status: 400 },
      );
    }
    leagueToSave = providedLeague as "pro" | "newbie";
  }

  if (!isValidUkrPhone(phone)) {
    return NextResponse.json(
      { error: "Вкажіть дійсний номер телефону у форматі +380XXXXXXXXX" },
      { status: 400 },
    );
  }

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

  // If championship has stages, require a valid stageId
  const rawStageId =
    typeof body.stageId === "string" ? body.stageId : undefined;
  const optingAllStages = rawStageId === "all";
  let providedStageId: string | undefined = undefined;

  if (optingAllStages) {
    // user chose to register to all stages — treat as no specific stage selected
    providedStageId = undefined;
  } else if (rawStageId) {
    // validate provided stage belongs to championship
    const stageExists = await Stage.findOne({
      _id: rawStageId,
      championshipId: current._id,
    })
      .select({ _id: 1 })
      .lean();
    if (!stageExists) {
      return NextResponse.json(
        { error: "Обраний етап недійсний для цього чемпіонату" },
        { status: 400 },
      );
    }
    providedStageId = rawStageId;
  } else {
    // no stage provided — require a stage only if the championship actually has stages
    const anyStage = await Stage.findOne({ championshipId: current._id })
      .select({ _id: 1 })
      .lean();
    if (anyStage) {
      return NextResponse.json(
        { error: "Оберіть етап для реєстрації" },
        { status: 400 },
      );
    }
  }

  const providedSwsId =
    typeof body.swsId === "string" && body.swsId.trim()
      ? body.swsId.trim()
      : undefined;

  // racesCount: 1 or 2 (1 by default). Accept string or number.
  let providedRacesCount = 1;
  if (body.racesCount !== undefined) {
    const rc = Number(body.racesCount);
    if (rc !== 1 && rc !== 2) {
      return NextResponse.json(
        { error: "Невірне значення участі у гонках" },
        { status: 400 },
      );
    }
    providedRacesCount = rc;
  }

  try {
    const pilot = await Pilot.create({
      championshipId: current._id,
      name,
      surname,
      number,
      phone,
      avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      league: leagueToSave,
      swsId: providedSwsId,
      // if user opted into all stages, `providedStageId` is undefined and pilot is not bound to a single stage
      stageId: providedStageId,
      racesCount: providedRacesCount,
    });

    // Log registration to audit (strip phone automatically)
    try {
      let stageInfo: { id: string; name?: string } | null = null;
      if (providedStageId) {
        const s = await Stage.findById(providedStageId)
          .select({ name: 1 })
          .lean();
        if (s)
          stageInfo = {
            id: providedStageId,
            name: (s as Partial<IStageType>).name,
          };
      }

      const after = sanitizeForAudit({
        name,
        surname,
        league: leagueToSave,
        championship: {
          id: String(current._id),
          name: (current as Partial<IChampionshipType>).name ?? "",
        },
        stage: stageInfo,
      });

      await logAudit({
        session: null,
        action: "create",
        entityType: "pilot",
        entityId: String((pilot as unknown as { _id: unknown })._id),
        entityLabel: `${name} ${surname}`,
        before: null,
        after,
        ip: getAuditIp(req),
      });
    } catch (err) {
      console.error("Failed to write pilot registration audit:", err);
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

    return NextResponse.json(
      { error: "Failed to register pilot" },
      { status: 500 },
    );
  }
}
