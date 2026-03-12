import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("380") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+38${digits}`;
  return `+${digits}`;
}

function isValidUkrPhone(phone: string): boolean {
  return /^\+380\d{9}$/.test(phone);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  let current;
  try {
    current = await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату. Зверніться до адміністратора." },
      { status: 409 },
    );
  }

  const body = await req.json().catch(() => ({}));

  if (current.championshipType === "teams") {
    const teamName =
      typeof body.teamName === "string" ? body.teamName.trim() : "";
    const teamNumber = Number(body.number);
    const teamPhone = normalizePhone(
      typeof body.phone === "string" ? body.phone : "",
    );

    if (
      teamName.length < 2 ||
      teamName.length > 60 ||
      !Number.isInteger(teamNumber) ||
      teamNumber < 1 ||
      teamNumber > 999
    ) {
      return NextResponse.json(
        { error: "Вкажіть назву команди і номер від 1 до 999" },
        { status: 400 },
      );
    }

    if (!isValidUkrPhone(teamPhone)) {
      return NextResponse.json(
        { error: "Вкажіть дійсний номер телефону у форматі +380XXXXXXXXX" },
        { status: 400 },
      );
    }

    try {
      const team = await Team.create({
        championshipId: current._id,
        name: teamName,
        number: teamNumber,
        phone: teamPhone,
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

  if (!isValidUkrPhone(phone)) {
    return NextResponse.json(
      { error: "Вкажіть дійсний номер телефону у форматі +380XXXXXXXXX" },
      { status: 400 },
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
