"use client";

import Link from "next/link";
import { SPONSOR_CONTACT_URL } from "@/lib/config/sponsors";

export default function SponsorsSection() {
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <a
            href="https://www.redbull.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 flex items-center gap-3 hover:scale-102 transition-transform"
          >
            <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center text-white font-black">RB</div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-1">Партнер</p>
              <p className="text-white font-semibold">Red Bull</p>
            </div>
          </a>

          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 p-4 flex items-center gap-3">
            <div>
              <p className="text-white font-semibold">Тут може бути ваш бренд</p>
              <p className="text-zinc-500 text-sm mt-1">Розміщення банера, згадки у соцмережах та на трасі.</p>
            </div>
          </div>

          <a
            href={SPONSOR_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 flex items-center gap-3 justify-center hover:bg-zinc-800"
          >
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-1">Зацікавлені?</p>
              <p className="text-white font-semibold">Обговорити партнерство</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
