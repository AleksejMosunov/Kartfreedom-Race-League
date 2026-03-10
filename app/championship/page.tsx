import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";

export const metadata = {
  title: "Таблица чемпионата — KartFreedom Race League",
  description: "Общая турнирная таблица картинг-лиги KartFreedom",
};

export default function ChampionshipPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Таблица чемпионата</h1>
        <p className="text-zinc-400 mt-1">
          Общий зачёт · наихудший этап каждого пилота не учитывается
        </p>
      </div>
      <ChampionshipTable />
    </main>
  );
}
