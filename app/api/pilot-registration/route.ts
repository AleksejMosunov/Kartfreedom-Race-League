import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = await req.json().catch(() => ({}));
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
      name,
      surname,
      number,
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
