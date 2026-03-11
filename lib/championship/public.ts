import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentChampionship } from "@/lib/championship/current";
import { LeagueSettings } from "@/lib/models/LeagueSettings";

export async function getPublicChampionshipStatus() {
  await connectToDatabase();

  const [current, settings] = await Promise.all([
    getCurrentChampionship(),
    LeagueSettings.findOne({ key: "global" }).lean(),
  ]);

  return {
    current,
    preseasonNews: settings?.preseasonNews ?? "",
  };
}
