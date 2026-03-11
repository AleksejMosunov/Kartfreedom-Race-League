import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const pilot = await Pilot.findById(id).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  return NextResponse.json(pilot);
}

export async function PUT(req: NextRequest, { params }: Params) {
  await connectToDatabase();
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

  const pilot = await Pilot.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  return NextResponse.json(pilot);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const pilot = await Pilot.findByIdAndDelete(id).lean();
  if (!pilot)
    return NextResponse.json({ error: "Pilot not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
