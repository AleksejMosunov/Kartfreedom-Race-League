import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const updated = await Championship.findOneAndUpdate(
    { _id: id, status: "active" },
    { status: "archived", endedAt: new Date() },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { error: "Active championship not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(updated);
}
