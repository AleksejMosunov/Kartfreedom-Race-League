"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinks = [
  { href: "/", label: "Головна" },
  { href: "/championship", label: "Чемпіонат" },
  { href: "/calendar", label: "Календар" },
];

export function Header() {
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  const championshipLinks = [
    { href: "/stages", label: "Етапи" },
    // { href: "/pilots", label: "Учасники" },
    // { href: "/stats", label: "Статистика" },
    { href: "/regulations", label: "Регламент" },
    // { href: "/register", label: "Реєстрація" },
  ];

  const navLinks = [...baseLinks, ...championshipLinks];

  return (
    <header className="bg-black border-b border-zinc-900 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
            <polygon points="0,0 13,10 0,20" fill="#ccff00" />
            <polygon points="7,0 20,10 7,20" fill="#ccff00" opacity="0.45" />
          </svg>
          <div className="flex flex-col leading-none gap-[2px]">
            <span className="font-black text-white text-base tracking-widest uppercase">
              Kart<span className="text-[#ccff00]">Freedom</span>
            </span>
            <span className="text-zinc-600 text-[9px] tracking-[0.25em] uppercase">Race League</span>
          </div>
        </Link>

        <nav className="hidden min-[800px]:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                ? "bg-[#ccff00] text-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
            >
              {link.label}
            </Link>
          ))}

        </nav>

        <details ref={mobileMenuRef} className="min-[800px]:hidden relative">
          <summary className="list-none cursor-pointer px-3 py-2 rounded-md text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors">
            Меню
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl p-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                  ? "bg-[#ccff00] text-black"
                  : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                  }`}
              >
                {link.label}
              </Link>
            ))}

          </div>
        </details>
      </div>
    </header>
  );
}
