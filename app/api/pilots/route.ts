import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";

export async function GET() {
  await connectToDatabase();
  const pilots = await Pilot.find().sort({ number: 1 }).lean();
  return NextResponse.json(pilots);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();
  try {
    const pilot = await Pilot.create(body);
    return NextResponse.json(pilot, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: `Pilot with number ${body.number} already exists` },
        { status: 409 },
      );
    }
    throw err;
  }
}
