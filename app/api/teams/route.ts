import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/lib/models/Team";
import { requireCurrentChampionship } from "@/lib/championship/current";

async function getNextTeamNumber(championshipId: string) {
  const last = await Team.findOne({ championshipId })
    .sort({ number: -1 })
    .select({ number: 1 })
    .lean();
  return (last?.number ?? 0) + 1;
}

export async function GET() {
  await connectToDatabase();
  let current;
  try {
    current = await requireCurrentChampionship();
  } catch {
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
    return NextResponse.json({ error: "Немає активного чемпіонату" }, { status: 409 });
  }

  if (current.championshipType !== "teams") {
    return NextResponse.json(
      { error: "Реєстрація команд доступна лише в командному чемпіонаті" },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    number?: number;
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
    Number.isInteger(explicitNumber) && explicitNumber >= 1 && explicitNumber <= 999
      ? explicitNumber
      : await getNextTeamNumber(String(current._id));

  try {
    const created = await Team.create({
      championshipId: current._id,
      name,
      number,
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
    return NextResponse.json({ error: "Не вдалося створити команду" }, { status: 500 });
  }
}
