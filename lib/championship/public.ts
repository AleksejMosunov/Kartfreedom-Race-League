import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";

export async function getPublicChampionshipStatus() {
  await connectToDatabase();

  const [active, settings] = await Promise.all([
    Championship.find({ status: "active" }).sort({ startedAt: -1 }).lean(),
    LeagueSettings.findOne({ key: "global" }).lean(),
  ]);

  return {
    active,
    current: active[0] ?? null,
    preseasonNews: {
      solo: settings?.preseasonNewsSolo ?? settings?.preseasonNews ?? "",
      teams: settings?.preseasonNewsTeams ?? "",
    },
  };
}
