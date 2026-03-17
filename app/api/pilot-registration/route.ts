import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { isValidUkrPhone, normalizePhone } from "@/lib/utils/phone";

function normalizeTeamDrivers(raw: unknown) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const obj = entry as { name?: unknown; surname?: unknown };
      const name =
        typeof obj.name === "string" ? normalizeNamePart(obj.name) : "";
      const surname =
        typeof obj.surname === "string" ? normalizeNamePart(obj.surname) : "";
      if (!name && !surname) return null;
      return { name, surname };
    })
    .filter((row): row is { name: string; surname: string } => row !== null);
}

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

  if (current.championshipType === "teams") {
    const isSolo = body.isSolo !== false;
    const teamNumber = Number(body.number);
    const teamPhone = normalizePhone(
      typeof body.phone === "string" ? body.phone : "",
    );

    if (!Number.isInteger(teamNumber) || teamNumber < 1 || teamNumber > 999) {
      return NextResponse.json(
        { error: "Вкажіть номер від 1 до 999" },
        { status: 400 },
      );
    }

    if (!isValidUkrPhone(teamPhone)) {
      return NextResponse.json(
        { error: "Вкажіть дійсний номер телефону у форматі +380XXXXXXXXX" },
        { status: 400 },
      );
    }

    const [duplicatePilot, duplicateTeam] = await Promise.all([
      Pilot.findOne({ championshipId: current._id, phone: teamPhone })
        .select({ _id: 1 })
        .lean(),
      Team.findOne({ championshipId: current._id, phone: teamPhone })
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

    if (isSolo) {
      const name =
        typeof body.name === "string" ? normalizeNamePart(body.name) : "";
      const surname =
        typeof body.surname === "string" ? normalizeNamePart(body.surname) : "";

      if (!isValidNamePart(name) || !isValidNamePart(surname)) {
        return NextResponse.json(
          { error: "Вкажіть ім'я та прізвище" },
          { status: 400 },
        );
      }

      const teamName = `${name} ${surname}`;

      try {
        const team = await Team.create({
          championshipId: current._id,
          name: teamName,
          number: teamNumber,
          phone: teamPhone,
          isSolo: true,
          drivers: [{ name, surname }],
        });

        return NextResponse.json(team, { status: 201 });
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          return NextResponse.json(
            {
              error: `Пілот \"${teamName}\" або номер ${teamNumber} вже зареєстровані`,
            },
            { status: 409 },
          );
        }

        return NextResponse.json(
          { error: "Не вдалося зареєструвати пілота" },
          { status: 500 },
        );
      }
    }

    const teamName =
      typeof body.teamName === "string" ? body.teamName.trim() : "";
    const drivers = normalizeTeamDrivers(
      (body as { drivers?: unknown }).drivers,
    );

    if (teamName.length < 2 || teamName.length > 60) {
      return NextResponse.json(
        { error: "Вкажіть назву команди" },
        { status: 400 },
      );
    }

    if (
      drivers.some(
        (driver) =>
          !isValidNamePart(driver.name) || !isValidNamePart(driver.surname),
      )
    ) {
      return NextResponse.json(
        { error: "Ім'я та прізвище пілота мають містити лише літери" },
        { status: 400 },
      );
    }

    if (drivers.length < 2) {
      return NextResponse.json(
        {
          error:
            "Для команди з кількома пілотами потрібно вказати мінімум двох (ім'я та прізвище)",
        },
        { status: 400 },
      );
    }

    try {
      const team = await Team.create({
        championshipId: current._id,
        name: teamName,
        number: teamNumber,
        phone: teamPhone,
        isSolo: false,
        drivers,
      });

      return NextResponse.json(team, { status: 201 });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return NextResponse.json(
          {
            error: `Команда з назвою \"${teamName}\" або номером ${teamNumber} вже зареєстрована`,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Не вдалося зареєструвати команду" },
        { status: 500 },
      );
    }
  }

  const name =
    typeof body.name === "string" ? normalizeNamePart(body.name) : "";
  const surname =
    typeof body.surname === "string" ? normalizeNamePart(body.surname) : "";
  const number = Number(body.number);
  const phone = normalizePhone(
    typeof body.phone === "string" ? body.phone : "",
  );
  // league MUST be provided by the registrant (no default)
  const league = typeof body.league === "string" ? body.league : "";
  if (!league) {
    return NextResponse.json(
      { error: "Вкажіть лігу пілота (pro або newbie)" },
      { status: 400 },
    );
  }
  if (league !== "pro" && league !== "newbie") {
    return NextResponse.json(
      { error: "Невірне значення ліги" },
      { status: 400 },
    );
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

  try {
    const pilot = await Pilot.create({
      championshipId: current._id,
      name,
      surname,
      number,
      phone,
      avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      league,
    });

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
