import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/championships", label: "Чемпіонати" },
  { href: "/admin/stages", label: "Етапи" },
  { href: "/admin/participants", label: "Учасники" },
  { href: "/admin/import", label: "Імпорт CSV" },
  { href: "/admin/regulations", label: "Регламент" },
  { href: "/admin/users", label: "Користувачі" },
  { href: "/admin/audit", label: "Аудит" },
  { href: "/admin/metrics", label: "Метрики" },
];

export default function AdminSidebarServer() {
  return (
    <div className="flex flex-row min-[800px]:flex-col min-[800px]:w-52 min-[800px]:shrink-0 border-b min-[800px]:border-b-0 min-[800px]:border-r border-zinc-900 bg-zinc-950 min-[800px]:sticky min-[800px]:top-16 min-[800px]:min-h-[calc(100vh-64px)]">
      <nav className="flex-1 flex flex-row min-[800px]:flex-col p-2 min-[800px]:p-3 gap-1 overflow-x-auto min-[800px]:overflow-visible">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors shrink-0 text-zinc-400 hover:text-white hover:bg-zinc-900"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden min-[800px]:flex flex-col gap-1 p-3 border-t border-zinc-900">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          На сайт
        </Link>
      </div>

      <div className="min-[800px]:hidden flex items-center px-2 shrink-0 border-l border-zinc-800 ml-1 pl-3">{/* placeholder for mobile logout */}</div>
    </div>
  );
}
