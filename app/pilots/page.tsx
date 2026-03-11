import { PilotsList } from "@/app/components/pilots/PilotsList";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";

export const metadata = {
  title: "Пілоти — KartFreedom Race League",
};

export default async function PilotsPage() {
  const { current, preseasonNews } = await getPublicChampionshipStatus();

  if (!current) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Пілоти</h1>
        <p className="text-zinc-400 mt-1">Усі учасники чемпіонату</p>
      </div>
      <PilotsList />
    </main>
  );
}
