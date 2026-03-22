import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";

export const metadata = {
  title: "Керування учасниками — KartFreedom Race League",
};

export default async function AdminParticipantsPage() {
  await connectToDatabase();

  const active = await Championship.find({ status: "active" })
    .sort({ startedAt: -1 })
    .lean();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors"
      >
        ← Адмін-панель
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Керування учасниками</h1>
        <p className="text-zinc-400 mt-1">
          Оберіть активний чемпіонат, для якого хочете керувати складом учасників.
        </p>
        {/* <Link href="/admin/import" className="inline-flex mt-4 rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors">
          Імпорт учасників з CSV
        </Link> */}
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-400">Активних чемпіонатів немає.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((item) => (
            <div
              key={String(item._id)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <h2 className="text-lg font-bold text-white">{item.name}</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Формат: {item.championshipType === "teams" ? "Endurance" : "Sprint"}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/admin/championships/${String(item._id)}`}>
                  <span className="inline-flex rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors">
                    Відкрити чемпіонат
                  </span>
                </Link>
                <Link
                  href={item.championshipType === "teams"
                    ? `/admin/teams?championship=${encodeURIComponent(String(item._id))}`
                    : `/admin/pilots?championship=${encodeURIComponent(String(item._id))}`}
                >
                  <span className="inline-flex rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors">
                    {item.championshipType === "teams" ? "До команд" : "До пілотів"}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
