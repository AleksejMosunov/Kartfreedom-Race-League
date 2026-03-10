import { PilotsList } from "@/app/components/pilots/PilotsList";

export const metadata = {
  title: "Пилоты — KartFreedom Race League",
};

export default function PilotsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Пилоты</h1>
        <p className="text-zinc-400 mt-1">Все участники чемпионата</p>
      </div>
      <PilotsList />
    </main>
  );
}
