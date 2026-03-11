import Link from "next/link";

export const metadata = {
  title: "Адмін-панель — KartFreedom Race League",
};

const sections = [
  {
    href: "/admin/pilots",
    icon: "🏎️",
    title: "Керування пілотами",
    description: "Додавати, редагувати та видаляти пілотів",
  },
  {
    href: "/admin/stages",
    icon: "🏁",
    title: "Керування етапами",
    description: "Створювати етапи та вносити результати гонок",
  },
  {
    href: "/admin/regulations",
    icon: "📘",
    title: "Керування регламентом",
    description: "Редагувати текст розділу регламенту на сайті",
  },
];

export default function AdminPage() {
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
