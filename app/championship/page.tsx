import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";

export const metadata = {
  title: "Таблиця чемпіонату — KartFreedom Race League",
  description: "Загальна турнірна таблиця картингової ліги KartFreedom",
};

export default function ChampionshipPage() {
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
