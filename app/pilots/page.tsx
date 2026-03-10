import { PilotsList } from "@/app/components/pilots/PilotsList";

export const metadata = {
  title: "Пілоти — KartFreedom Race League",
};

export default function PilotsPage() {
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
