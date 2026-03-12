import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/lib/models/Team";
import { requireCurrentChampionship } from "@/lib/championship/current";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
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
      { error: "Операція доступна лише для Endurance-чемпіонату" },
      { status: 409 },
    );
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    number?: number;
  };

  const update: { name?: string; number?: number } = {};
  if (typeof body.name === "string") {
    const normalized = body.name.trim();
    if (normalized.length < 2 || normalized.length > 60) {
      return NextResponse.json(
        { error: "Назва команди має бути від 2 до 60 символів" },
        { status: 400 },
      );
    }
    update.name = normalized;
  }

  if (body.number !== undefined) {
    const number = Number(body.number);
    if (!Number.isInteger(number) || number < 1 || number > 999) {
      return NextResponse.json(
        { error: "Номер має бути цілим числом від 1 до 999" },
        { status: 400 },
      );
    }
    update.number = number;
  }

  try {
    const updated = await Team.findOneAndUpdate(
      { _id: id, championshipId: current._id },
      update,
      { new: true, runValidators: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Команду не знайдено" },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
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
      { error: "Не вдалося оновити команду" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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
      { error: "Операція доступна лише для Endurance-чемпіонату" },
      { status: 409 },
    );
  }

  const { id } = await params;

  const removed = await Team.findOneAndDelete({
    _id: id,
    championshipId: current._id,
  }).lean();

  if (!removed) {
    return NextResponse.json({ error: "Команду не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
