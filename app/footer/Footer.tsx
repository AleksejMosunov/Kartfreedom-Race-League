import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-900 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-zinc-900">

          <div>
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
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-3">Навігація</p>
            <div className="flex flex-col gap-2">
              {([
                { href: "/", label: "Чемпіонат" },
                { href: "/stages", label: "Етапи" },
                { href: "/pilots", label: "Учасники" },
                { href: "/stats", label: "Статистика" },
                { href: "/regulations", label: "Регламент" },
                { href: "/register", label: "Реєстрація" },
              ] as const).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-400 text-sm hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-3">Слідкуйте за нами</p>
            <div className="flex flex-col gap-2">
              {[
                { href: "https://t.me/kartfreedoms", label: "Telegram", tag: "TG" },
                { href: "https://www.instagram.com/kartfreedom/", label: "Instagram", tag: "IG" },
                { href: "https://www.facebook.com/kartfreedom", label: "Facebook", tag: "FB" },
                { href: "https://www.youtube.com/c/KartFreedomGoKartTrack", label: "YouTube", tag: "YT" },
              ].map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 text-sm hover:text-white transition-colors"
                >
                  <span className="text-[#ccff00] text-[10px] font-black w-5">{s.tag}</span>
                  {s.label}
                </a>
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
