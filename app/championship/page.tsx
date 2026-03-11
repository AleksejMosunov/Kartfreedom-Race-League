import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";

export const revalidate = 0;

export const metadata = {
  title: "Таблиця чемпіонату — KartFreedom Race League",
  description: "Загальна турнірна таблиця картингової ліги KartFreedom",
};

export default async function ChampionshipPage() {
  const { current, preseasonNews } = await getPublicChampionshipStatus();

  if (!current) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Таблиця чемпіонату</h1>
          <p className="text-zinc-400 mt-1">
            Загальний залік · найгірший етап кожного пілота не враховується
          </p>
        </div>
        <NoActiveChampionshipBlock news={preseasonNews} />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Таблиця чемпіонату</h1>
        <p className="text-zinc-400 mt-1">
          Загальний залік · найгірший етап кожного пілота не враховується
        </p>
      </div>
      <ChampionshipTable />
    </main>
  );
}
