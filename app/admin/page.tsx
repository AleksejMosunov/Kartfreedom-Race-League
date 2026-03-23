import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Адмін-панель — KartFreedom Race League",
};

export default async function AdminPage() {
  await connectToDatabase();
  const nowPlusTwoWeeks = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const [active, upcoming] = await Promise.all([
    Championship.find({ status: "active", startedAt: { $lte: nowPlusTwoWeeks } }).lean(),
    Championship.find({ status: "active", startedAt: { $gt: nowPlusTwoWeeks } }).lean(),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-1">Дашборд</h1>
      <p className="text-zinc-500 text-sm mb-8">KartFreedom Race League</p>

      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Активні чемпіонати</h2>
          {active.length > 0 ? (
            <div className="space-y-2">
              {active.map((champ) => (
                <div
                  key={String(champ._id)}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-white text-sm truncate">{champ.name}</span>
                    <span className="text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
                      {champ.championshipType === "teams" ? "Endurance" : champ.championshipType === "sprint-pro" ? "Sprint (Pro)" : "Sprint"}
                    </span>
                  </div>
                  <Link href="/admin/stages" className="text-xs text-[#ccff00] hover:opacity-80 transition-opacity shrink-0 ml-4">До етапів →</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-400 text-sm">Немає активних чемпіонатів</p>
              <Link href="/admin/championships" className="inline-block mt-3 text-sm text-[#ccff00] hover:opacity-80 transition-opacity">Створити чемпіонат →</Link>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Неактивні / Майбутні</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map((champ) => (
                <div
                  key={String(champ._id)}
                  className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 opacity-90"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-zinc-200 text-sm truncate">{champ.name}</span>
                    <span className="text-xs text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
                      {champ.championshipType === "teams" ? "Endurance" : champ.championshipType === "sprint-pro" ? "Sprint (Pro)" : "Sprint"}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 shrink-0 ml-4">Старт: {new Date(champ.startedAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-zinc-400 text-sm">Неактивних чемпіонатів немає.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
