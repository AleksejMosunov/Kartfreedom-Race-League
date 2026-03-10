"use client";

import { useState } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { Loader } from "@/app/components/ui/Loader";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";

export default function AdminPilotsPage() {
  const { pilots, isLoading, error, addPilot, deletePilot } = usePilots();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !number) return;
    if (pilots.some((p) => p.number === Number(number))) {
      setFormError(`Пилот с номером #${number} уже существует`);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await addPilot({ name: name.trim(), number: Number(number) });
      setName("");
      setNumber("");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Админ-панель
      </Link>
      <h1 className="text-3xl font-black text-white mb-8">Пилоты</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Добавить пилота</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Имя пилота *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            required
          />
          <input
            type="number"
            placeholder="Номер *"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            min={1}
            required
          />
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Добавление..." : "Добавить"}
            </Button>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
          </div>
        </form>
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
              Удалить
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
