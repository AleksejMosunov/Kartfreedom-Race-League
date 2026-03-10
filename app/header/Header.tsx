"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/app/header/AdminLogoutButton";

const navLinks = [
  { href: "/", label: "Чемпіонат" },
  { href: "/stages", label: "Етапи" },
  { href: "/pilots", label: "Пілоти" },
  { href: "/register", label: "Реєстрація" },
];

export function Header() {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏁</span>
          <span className="font-black text-white text-lg tracking-tight">
            Kart<span className="text-red-500">Freedom</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
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
          <Link
            href="/admin"
            className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700"
          >
            Адмін
          </Link>
          {isAdminArea && <AdminLogoutButton />}
        </nav>
      </div>
    </header>
  );
}
