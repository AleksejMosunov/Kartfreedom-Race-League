import { defaultRegulationsForNewChampionship } from "@/lib/championship/regulations";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";

const SETTINGS_KEY = "global";

export async function GET() {
  await connectToDatabase();

  const [active, archived, settings] = await Promise.all([
    Championship.find({ status: "active" }).sort({ startedAt: -1 }).lean(),
    Championship.find({ status: "archived" })
      .sort({ endedAt: -1, startedAt: -1 })
      .lean(),
    LeagueSettings.findOne({ key: SETTINGS_KEY }).lean(),
  ]);

  return NextResponse.json({
    active,
    current: active[0] ?? null,
    archived,
    preseasonNews: settings?.preseasonNews ?? "",
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    championshipType?: "solo" | "teams";
    fastestLapBonusEnabled?: boolean;
  };
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `Чемпіонат ${new Date().toLocaleDateString("uk-UA")}`;
  if (body.championshipType !== "solo" && body.championshipType !== "teams") {
    return NextResponse.json(
      { error: "Оберіть формат чемпіонату: Sprint або Endurance" },
      { status: 400 },
    );
  }

  const championshipType = body.championshipType;
  const fastestLapBonusEnabled = Boolean(body.fastestLapBonusEnabled);

  const created = await Championship.create({
    name,
    status: "active",
    championshipType,
    fastestLapBonusEnabled,
    startedAt: new Date(),
    regulations: defaultRegulationsForNewChampionship(fastestLapBonusEnabled),
  });

  return NextResponse.json(created, { status: 201 });
}
