import { HomeChampionshipHub } from "@/app/components/championship/HomeChampionshipHub";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import { sortSprintFirst } from "@/lib/utils/uiChampionship";

export const revalidate = 0;

export const metadata = {
  title: "KartFreedom Race League — Головна",
  description: "Офіційна сторінка ліги KartFreedom: анонси етапів, новини та ключова інформація сезону.",
};

export default async function Home() {
  const { active, preseasonNews } = await getPublicChampionshipStatus();

  const championshipTabs = sortSprintFirst((active ?? []).map((item) => ({
    _id: String(item._id),
    name: item.name,
    championshipType: item.championshipType,
    prizes: ((item as Record<string, unknown>).prizes as { place: string; description: string; }[] | undefined) ?? [],
  })));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <HomeChampionshipHub active={championshipTabs} preseasonNews={preseasonNews} />
    </main>
  );
}
