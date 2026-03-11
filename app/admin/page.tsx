import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentChampionship } from "@/lib/championship/current";

export const metadata = {
  title: "Адмін-панель — KartFreedom Race League",
};

export default async function AdminPage() {
  await connectToDatabase();
  const current = await getCurrentChampionship();
  const isTeams = current?.championshipType === "teams";

  const sections = [
    {
      href: isTeams ? "/admin/teams" : "/admin/pilots",
      icon: isTeams ? "👥" : "🏎️",
      title: isTeams ? "Керування командами" : "Керування пілотами",
      description: isTeams
        ? "Додавати, редагувати та видаляти команди"
        : "Додавати, редагувати та видаляти пілотів",
    },
    {
      href: "/admin/stages",
      icon: "🏁",
      title: "Керування етапами",
      description: "Створювати етапи та вносити результати гонок",
    },
    {
      href: "/admin/championships",
      icon: "🏆",
      title: "Керування чемпіонатами",
      description: "Старт нового чемпіонату та архів завершених",
    },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Адмін-панель</h1>
        <p className="text-zinc-400 mt-1">Керування чемпіонатом KartFreedom Race League</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-600 transition-colors cursor-pointer">
              <span className="text-3xl">{section.icon}</span>
              <h2 className="text-white font-bold text-lg mt-3">{section.title}</h2>
              <p className="text-zinc-400 text-sm mt-1">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
