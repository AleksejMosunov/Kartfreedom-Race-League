import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";

async function getNextTeamNumber(championshipId: string) {
  const last = await Team.findOne({ championshipId })
    .sort({ number: -1 })
    .select({ number: 1 })
    .lean();
  return (last?.number ?? 0) + 1;
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
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

  if (current.championshipType !== "teams") {
    return NextResponse.json([]);
  }

  const teams = await Team.find({ championshipId: current._id })
    .sort({ number: 1, name: 1 })
    .lean();

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  let current;
  try {
    current = await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }

  if (current.championshipType !== "teams") {
    return NextResponse.json(
      { error: "Реєстрація команд доступна лише в Endurance-чемпіонаті" },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    number?: number;
    phone?: string;
    isSolo?: boolean;
    drivers?: Array<{ name?: string; surname?: string }>;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json(
      { error: "Назва команди має бути від 2 до 60 символів" },
      { status: 400 },
    );
  }

  const explicitNumber = Number(body.number);
  const number =
    Number.isInteger(explicitNumber) &&
    explicitNumber >= 1 &&
    explicitNumber <= 999
      ? explicitNumber
      : await getNextTeamNumber(String(current._id));

  const isSolo = body.isSolo !== false;
  const drivers = Array.isArray(body.drivers)
    ? body.drivers
        .map((driver) => {
          const driverName =
            typeof driver.name === "string"
              ? normalizeNamePart(driver.name)
              : "";
          const driverSurname =
            typeof driver.surname === "string"
              ? normalizeNamePart(driver.surname)
              : "";
          if (!driverName && !driverSurname) return null;
          return { name: driverName, surname: driverSurname };
        })
        .filter(
          (driver): driver is { name: string; surname: string } =>
            driver !== null,
        )
    : [];

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

  if (!isSolo && drivers.length < 2) {
    return NextResponse.json(
      {
        error:
          "Для команди з кількома пілотами потрібно вказати мінімум двох (ім'я та прізвище)",
      },
      { status: 400 },
    );
  }

  try {
    const created = await Team.create({
      championshipId: current._id,
      name,
      number,
      phone: typeof body.phone === "string" ? body.phone.trim() : undefined,
      isSolo,
      drivers: isSolo ? drivers.slice(0, 1) : drivers,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Команда з такою назвою або номером вже існує" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Не вдалося створити команду" },
      { status: 500 },
    );
  }
}
