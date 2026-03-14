import { RegulationsHub } from "@/app/components/championship/RegulationsHub";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import { sortSprintFirst } from "@/lib/utils/uiChampionship";

export const metadata = {
  title: "KartFreedom Race League — Регламент",
  description: "Офіційний регламент проведення чемпіонату KartFreedom Race League",
};

export default async function RegulationsPage() {
  const { active, preseasonNews } = await getPublicChampionshipStatus();

  if (!active.length) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  const championships = sortSprintFirst(active.map((item) => ({
    _id: String(item._id),
    name: item.name,
    championshipType: item.championshipType,
  })));

  return <RegulationsHub active={championships} />;
}
