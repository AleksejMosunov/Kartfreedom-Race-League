"use client";

import { usePilots } from "@/app/hooks/usePilots";
import { Loader } from "@/app/components/ui/Loader";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";

export default function AdminPilotsPage() {
  const { pilots, isLoading, error, deletePilot } = usePilots();

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Адмін-панель
      </Link>
      <h1 className="text-3xl font-black text-white mb-8">Пілоти</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-2">Публічна реєстрація активна</h2>
        <p className="text-sm text-zinc-400">
          Нові пілоти реєструються самостійно через сторінку
          {" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 underline">
            /register
          </Link>
          .
        </p>
      </div>
      {isLoading && <Loader />}
      {error && <p className="text-red-400">{error}</p>}
      <div className="space-y-2">
        {pilots.map((pilot) => (
          <div
            key={pilot._id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-mono text-sm w-8">#{pilot.number}</span>
              <span className="font-semibold text-white">{pilot.name}</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => deletePilot(pilot._id)}>
              Видалити
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
