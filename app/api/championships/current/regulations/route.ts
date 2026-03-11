import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { Championship } from "@/lib/models/Championship";
import { normalizeRegulationsPayload } from "@/lib/championship/regulations";

export async function GET() {
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

  return NextResponse.json(current.regulations);
}

export async function PUT(req: NextRequest) {
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

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    intro?: string;
    sections?: Array<{ title?: string; content?: string }>;
  };

  const normalized = normalizeRegulationsPayload(body);
  if (!normalized) {
    return NextResponse.json(
      { error: "Invalid regulations payload" },
      { status: 400 },
    );
  }

  const updated = await Championship.findByIdAndUpdate(
    current._id,
    { regulations: normalized },
    { new: true, runValidators: true },
  ).lean();

  return NextResponse.json(updated?.regulations ?? normalized);
}
