import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";
import { requireCurrentChampionship } from "@/lib/championship/current";

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

  if (current.championshipType === "teams") {
    const teams = await Team.find({ championshipId: current._id })
      .sort({ number: 1, name: 1 })
      .lean();
    const participants = teams.map((team) => ({
      _id: String(team._id),
      name: team.name,
      surname: "",
      number: team.number,
      phone: team.phone,
      teamIsSolo: team.isSolo,
      teamDrivers: team.drivers ?? [],
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));
    return NextResponse.json(participants);
  }

  const pilots = await Pilot.find({ championshipId: current._id })
    .sort({ number: 1 })
    .lean();
  return NextResponse.json(pilots);
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

  const name =
    typeof body.name === "string" ? normalizeNamePart(body.name) : "";
  const surname =
    typeof body.surname === "string" ? normalizeNamePart(body.surname) : "";
  const number = Number(body.number);

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
      ...body,
      championshipId: current._id,
      name,
      surname,
      number,
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
    throw err;
  }
}
