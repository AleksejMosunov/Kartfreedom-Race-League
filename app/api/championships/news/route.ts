import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { LeagueSettings } from "@/lib/models/LeagueSettings";

const SETTINGS_KEY = "global";

export async function PUT(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json().catch(() => ({}))) as {
    preseasonNews?: string;
    preseasonNewsByType?: {
      solo?: string;
      teams?: string;
    };
  };
  const preseasonNews =
    typeof body.preseasonNews === "string" ? body.preseasonNews.trim() : "";
  const preseasonNewsSolo =
    typeof body.preseasonNewsByType?.solo === "string"
      ? body.preseasonNewsByType.solo.trim()
      : preseasonNews;
  const preseasonNewsTeams =
    typeof body.preseasonNewsByType?.teams === "string"
      ? body.preseasonNewsByType.teams.trim()
      : "";

  const saved = await LeagueSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      key: SETTINGS_KEY,
      preseasonNews,
      preseasonNewsSolo,
      preseasonNewsTeams,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return NextResponse.json({
    preseasonNews: saved?.preseasonNews ?? "",
    preseasonNewsByType: {
      solo: saved?.preseasonNewsSolo ?? saved?.preseasonNews ?? "",
      teams: saved?.preseasonNewsTeams ?? "",
    },
  });
}
