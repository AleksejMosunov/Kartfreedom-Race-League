import React from "react";
import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { normalizeSocialLinks, SOCIAL_LINK_META, SocialLinks } from "@/lib/socialLinks";

export async function Footer() {
  let socialLinks: SocialLinks = normalizeSocialLinks();

  try {
    await connectToDatabase();
    const settings = await LeagueSettings.findOne({ key: "global" })
      .select({ socialLinks: 1 })
      .lean();
    socialLinks = normalizeSocialLinks(
      settings?.socialLinks as Partial<SocialLinks> | undefined,
    );
  } catch {
    socialLinks = normalizeSocialLinks();
  }

  // Helper to split array into chunks of 2
  function chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  }

  const navLinks = [
    { href: "/", label: "Головна" },
    { href: "/championship", label: "Чемпіонат" },
    { href: "/stages", label: "Етапи" },
    { href: "/pilots", label: "Учасники" },
    // { href: "/stats", label: "Статистика" },
    { href: "/regulations", label: "Регламент" },
    { href: "/register", label: "Реєстрація" },
  ];
  // Разбиваем навигацию на максимум 3 колонки
  function chunkArrayEven<T>(arr: T[], columns: number): T[][] {
    const result: T[][] = Array.from({ length: columns }, () => []);
    arr.forEach((item, idx) => {
      result[idx % columns].push(item);
    });
    return result;
  }
  const navChunks = chunkArrayEven(navLinks, 3);
  const socialChunks = chunkArray(SOCIAL_LINK_META, 2);

  // SVG-иконки для соцсетей
  const socialIcons: Record<string, React.ReactNode> = {
    telegram: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="10" fill="#229ED9" />
        <path d="M15.5 5.5L13.5 15.5C13.5 15.5 13.2 16.2 12.5 15.9L8.5 12.7L6.9 12.1L4.5 11.3C4.5 11.3 4 11.1 4.1 10.7C4.1 10.7 4.2 10.5 4.7 10.3L14.2 6.1C14.2 6.1 15.5 5.5 15.5 5.5Z" fill="white" />
        <path d="M8.5 12.7L8.2 15C8.2 15 8.1 15.2 8.3 15.2C8.4 15.2 8.5 15.1 8.6 15C8.7 14.9 9.5 14.2 9.5 14.2" stroke="#229ED9" strokeWidth="0.5" />
      </svg>
    ),
    instagram: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ig-gradient" cx="50%" cy="50%" r="80%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#fbe9a6" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#fdc094" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#fd5949" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#d6249f" />
            <stop offset="100%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <circle cx="10" cy="10" r="10" fill="url(#ig-gradient)" />
        <rect x="5.8" y="5.8" width="8.4" height="8.4" rx="2.7" stroke="white" strokeWidth="0.8" fill="none" />
        <circle cx="10" cy="10" r="2" stroke="white" strokeWidth="0.8" fill="none" />
        <circle cx="13.1" cy="6.9" r="0.5" fill="white" />
      </svg>
    ),
    facebook: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="20" rx="5" fill="#1877F3" />
        <path d="M13.5 10.5H11.5V16H9V10.5H7.5V8.5H9V7.5C9 6.1 9.8 5 11.5 5H13.5V7H12.5C12.2 7 12 7.2 12 7.5V8.5H13.5L13.5 10.5Z" fill="white" />
      </svg>
    ),
    youtube: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="20" rx="5" fill="#FF0000" />
        <polygon points="8,6 15,10 8,14" fill="white" />
      </svg>
    ),
    tiktok: (
      <img
        src="https://img.freepik.com/premium-vector/tik-tok-logo_578229-290.jpg?w=360"
        alt="TikTok"
        className="w-5 h-5 object-cover rounded"
      />
    ),
  };

  return (
    <footer className="bg-black border-t border-zinc-900 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 pb-8 border-b border-zinc-900 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polygon points="0,0 13,10 0,20" fill="#ccff00" />
                <polygon points="7,0 20,10 7,20" fill="#ccff00" opacity="0.45" />
              </svg>
              <span className="font-black text-white text-sm tracking-widest uppercase">
                Kart<span className="text-[#ccff00]">Freedom</span>
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Офіційна ліга змагань картинг-центру KartFreedom.
            </p>
            <a
              href="https://www.kartfreedom.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#ccff00] text-xs font-semibold hover:underline"
            >
              kartfreedom.com ↗
            </a>
          </div>

          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-3 ">Навігація</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
              {navChunks.map((chunk, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {chunk.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-block w-fit text-zinc-400 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-3">Слідкуйте за нами</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {socialChunks.map((chunk, i) => (
                <div key={i} className="flex flex-col gap-2">
                  {chunk.map((s) => (
                    <a
                      key={s.key}
                      href={socialLinks[s.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors"
                    >
                      <span className="w-5 h-5 flex items-center justify-center">{socialIcons[s.key]}</span>
                      {s.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-zinc-600 text-xs">© 2025 KartFreedom. Всі права захищено.</p>
          <p className="text-zinc-700 text-xs">Race League Platform</p>
        </div>
      </div>
    </footer>
  );
}
