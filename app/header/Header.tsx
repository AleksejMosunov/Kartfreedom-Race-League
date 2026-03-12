"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/app/header/AdminLogoutButton";

const baseLinks = [{ href: "/", label: "Чемпіонат" }];
type ChampionshipType = "solo" | "teams";

export function Header() {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const [hasActiveChampionship, setHasActiveChampionship] = useState(false);
  const [championshipType, setChampionshipType] = useState<ChampionshipType>("solo");
  const [isLoading, setIsLoading] = useState(true);
  const adminLinkClass =
    "px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700";

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/championships", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          current?: { championshipType?: ChampionshipType; } | null;
        };
        setHasActiveChampionship(Boolean(data.current));
        setChampionshipType(data.current?.championshipType === "teams" ? "teams" : "solo");
      } catch {
        setHasActiveChampionship(false);
        setChampionshipType("solo");
      } finally {
        setIsLoading(false);
      }
    };

    void loadStatus();
  }, [pathname]);

  const championshipLinks = [
    { href: "/stages", label: "Етапи" },
    { href: "/pilots", label: championshipType === "teams" ? "Команди" : "Пілоти" },
    { href: "/stats", label: "Статистика" },
    { href: "/regulations", label: "Регламент" },
    // { href: "/register", label: "Реєстрація" },
  ];

  const navLinks = !isLoading && hasActiveChampionship
    ? [...baseLinks, ...championshipLinks]
    : baseLinks;

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏁</span>
          <span className="font-black text-white text-lg tracking-tight">
            Kart<span className="text-red-500">Freedom</span>
          </span>
        </Link>

        <nav className="hidden min-[800px]:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className={`ml-4 ${adminLinkClass}`}>
            Адмін
          </Link>
          {isAdminArea && <AdminLogoutButton />}
        </nav>

        <details ref={mobileMenuRef} className="min-[800px]:hidden relative">
          <summary className="list-none cursor-pointer px-3 py-2 rounded-md text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors">
            Меню
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl p-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                  ? "bg-red-600 text-white"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-1 border-t border-zinc-800" />
            <Link href="/admin" onClick={closeMobileMenu} className={adminLinkClass}>
              Адмін
            </Link>
            {isAdminArea && <AdminLogoutButton />}
          </div>
        </details>
      </div>
    </header>
  );
}
