import { HomeChampionshipHub } from "@/app/components/championship/HomeChampionshipHub";
import { getPublicChampionshipStatus } from "@/lib/championship/public";

export const revalidate = 0;

export const metadata = {
  title: "KartFreedom Race League — Таблиця чемпіонату",
  description: "Турнірна таблиця картингового чемпіонату KartFreedom Race League",
};

export default async function Home() {
  const { active, preseasonNews } = await getPublicChampionshipStatus();

  const championshipTabs = (active ?? []).map((item) => ({
    _id: String(item._id),
    name: item.name,
    championshipType: item.championshipType,
    prizes: ((item as Record<string, unknown>).prizes as { place: string; description: string; }[] | undefined) ?? [],
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <HomeChampionshipHub active={championshipTabs} preseasonNews={preseasonNews} />
    </main>
  );
}
