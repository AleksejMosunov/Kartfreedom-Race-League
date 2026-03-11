import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const stage = await Stage.findById(id)
    .populate("results.pilotId", "name surname number team avatar")
    .lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json(stage);
}

export async function PUT(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const body = await req.json();
  const stage = await Stage.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  })
    .populate("results.pilotId", "name surname number team avatar")
    .lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json(stage);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;
  const stage = await Stage.findByIdAndDelete(id).lean();
  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
