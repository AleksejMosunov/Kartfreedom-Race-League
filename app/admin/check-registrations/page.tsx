"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui";

export default function CheckRegistrationsPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any | null>(null);

  const handle = async () => {
    setError("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/check-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Error fetching registrations");
      setData(body.registrations || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Перевірити реєстрації</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон +380XXXXXXXXX"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
          <Button onClick={handle} disabled={loading}>{loading ? "Завантаження..." : "Отримати реєстрації"}</Button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {data && (
        <div className="space-y-4">
          {data.length === 0 && <p className="text-zinc-400">Реєстрацій не знайдено.</p>}
          {data.map((c: any) => (
            <div key={c.championshipId} className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
              <p className="text-white font-semibold">{c.championshipName ?? c.championshipId}</p>
              <ul className="mt-2">
                {Array.isArray(c.stages) && c.stages.map((s: any) => (
                  <li key={s.stageId} className="text-zinc-300 text-sm mb-1">
                    <div className="font-medium">{s.stageName ?? s.stageId}</div>
                    <div className="text-zinc-400 text-xs">Гонки: {Array.isArray(s.races) && s.races.length > 0 ? s.races.map((r: number) => `Гонка ${r}`).join(", ") : "(не вказано)"}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-4 ">
        Якщо у вас виникли питання або проблеми з реєстрацією, будь ласка, зв&apos;яжіться з організатором:
        <br />
        <a href="https://t.me/aleksej_mosunov" className="text-red-500 hover:underline">Telegram</a>
      </div>
    </main>
  );
}
