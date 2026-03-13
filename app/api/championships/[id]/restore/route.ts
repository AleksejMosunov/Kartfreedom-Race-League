import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const toRestore = await Championship.findById(id).lean();
  if (!toRestore) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }

  if (toRestore.status !== "archived") {
    return NextResponse.json(
      { error: "Відновити можна лише чемпіонат з архіву" },
      { status: 409 },
    );
  }

  const restored = await Championship.findByIdAndUpdate(
    id,
    {
      status: "active",
      $unset: { endedAt: "" },
    },
    { new: true },
  ).lean();

  return NextResponse.json(restored);
}
