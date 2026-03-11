import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";

const SETTINGS_KEY = "global";

export async function GET() {
  await connectToDatabase();

  const [current, archived, settings] = await Promise.all([
    Championship.findOne({ status: "active" }).sort({ startedAt: -1 }).lean(),
    Championship.find({ status: "archived" })
      .sort({ endedAt: -1, startedAt: -1 })
      .lean(),
    LeagueSettings.findOne({ key: SETTINGS_KEY }).lean(),
  ]);

  return NextResponse.json({
    current,
    archived,
    preseasonNews: settings?.preseasonNews ?? "",
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const existing = await Championship.findOne({ status: "active" }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "Спочатку завершіть поточний чемпіонат" },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `Чемпіонат ${new Date().toLocaleDateString("uk-UA")}`;

  const created = await Championship.create({
    name,
    status: "active",
    startedAt: new Date(),
  });

  return NextResponse.json(created, { status: 201 });
}
