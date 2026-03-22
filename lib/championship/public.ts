import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";

export async function getPublicChampionshipStatus() {
  await connectToDatabase();

  const nowPlusTwoWeeks = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const [active, settings] = await Promise.all([
    Championship.find({
      status: "active",
      startedAt: { $lte: nowPlusTwoWeeks },
    })
      .sort({ startedAt: -1 })
      .lean(),
    LeagueSettings.findOne({ key: "global" }).lean(),
  ]);

  return {
    active,
    current: active[0] ?? null,
    preseasonNews: {
      solo: settings?.preseasonNewsSolo ?? settings?.preseasonNews ?? "",
      teams: settings?.preseasonNewsTeams ?? "",
      sprintPro:
        settings?.preseasonNewsSprintPro ??
        settings?.preseasonNewsSolo ??
        settings?.preseasonNews ??
        "",
    },
  };
}
