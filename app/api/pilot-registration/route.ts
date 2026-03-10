import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const number = Number(body.number);

  if (!name || !Number.isInteger(number) || number < 1) {
    return NextResponse.json(
      { error: "Name and number are required" },
      { status: 400 },
    );
  }

  try {
    const pilot = await Pilot.create({
      name,
      number,
      avatar: typeof body.avatar === "string" ? body.avatar : undefined,
    });

    return NextResponse.json(pilot, { status: 201 });
  } catch (err: unknown) {
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
