import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { MultiChampionshipTabs } from "@/app/components/championship/MultiChampionshipTabs";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import SponsorsSection from "@/app/components/championship/SponsorsSection";

export const revalidate = 0;

export const metadata = {
  title: "Таблиця чемпіонату — KartFreedom Race League",
  description: "Загальна турнірна таблиця картингової ліги KartFreedom",
};

// SponsorsSection component displays partners and sponsor slots

export default async function ChampionshipPage() {
  const { active, preseasonNews } = await getPublicChampionshipStatus();

  if (!active.length) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Таблиця чемпіонату</h1>
          <p className="text-zinc-400 mt-1">
            Загальний залік
          </p>
        </div>
        <SponsorsSection />
        <NoActiveChampionshipBlock news={preseasonNews} />
      </main>
    );
  }

  if (active.length === 1) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Таблиця чемпіонату</h1>
          <p className="text-zinc-400 mt-1">
            Загальний залік
          </p>
        </div>
        <SponsorsSection />
        <ChampionshipTable />
      </main>
    );
  }

  // Multiple active championships — render tab selector on client
  const championships = active.map((c) => ({
    _id: String(c._id),
    name: c.name,
    championshipType: c.championshipType,
  }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Таблиця чемпіонату</h1>
        <p className="text-zinc-400 mt-1">
          Загальний залік
        </p>
      </div>
      <SponsorsSection />
      <MultiChampionshipTabs championships={championships} />
    </main>
  );
}
