import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { MultiChampionshipTabs } from "@/app/components/championship/MultiChampionshipTabs";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import { SPONSOR_CONTACT_URL } from "@/lib/config/sponsors";

export const revalidate = 0;

export const metadata = {
  title: "Таблиця чемпіонату — KartFreedom Race League",
  description: "Загальна турнірна таблиця картингової ліги KartFreedom",
};

function SponsorsPlaceholderSection() {
  return (
    <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 overflow-hidden relative">
      <div className="pointer-events-none absolute -top-20 -right-10 w-52 h-52 rounded-full bg-[#ccff00]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#ccff00] mb-2">Партнери та спонсори</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Тут може бути ваш бренд</h2>

          </div>
          <a
            href={SPONSOR_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#ccff00] hover:bg-lime-300 px-4 py-2 text-sm font-black text-black transition-colors"
          >
            Обговорити партнерство
          </a>
        </div>
      </div>
    </section>
  );
}

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
        <SponsorsPlaceholderSection />
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
        <SponsorsPlaceholderSection />
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
      <SponsorsPlaceholderSection />
      <MultiChampionshipTabs championships={championships} />
    </main>
  );
}
