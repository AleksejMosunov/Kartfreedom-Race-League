import { PilotsHub } from "@/app/components/pilots/PilotsHub";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";

export const metadata = {
  title: "Пілоти — KartFreedom Race League",
};

export default async function PilotsPage() {
  const { active, preseasonNews } = await getPublicChampionshipStatus();

  if (!active.length) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  const activeTabs = active.map((item) => ({
    _id: String(item._id),
    name: item.name,
    championshipType: item.championshipType,
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <PilotsHub active={activeTabs} />
    </main>
  );
}
