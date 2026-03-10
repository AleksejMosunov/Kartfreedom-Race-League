import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";

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
