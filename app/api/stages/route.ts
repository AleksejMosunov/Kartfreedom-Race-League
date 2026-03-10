import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";

export async function GET() {
  await connectToDatabase();
  const stages = await Stage.find()
    .populate("results.pilotId", "name number team avatar")
    .sort({ number: 1 })
    .lean();
  return NextResponse.json(stages);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();
  try {
    const stage = await Stage.create(body);
    return NextResponse.json(stage, { status: 201 });
  } catch (err) {
    if ((err as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: `Stage with number ${body.number} already exists` },
        { status: 409 },
      );
    }
    throw err;
  }
}
