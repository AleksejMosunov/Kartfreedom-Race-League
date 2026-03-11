"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Loader } from "@/app/components/ui/Loader";
import { Team } from "@/types";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingNumber, setEditingNumber] = useState("");
  const [error, setError] = useState("");

  const loadTeams = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teams", { cache: "no-store" });
      const body = (await res.json().catch(() => [])) as Team[] | { error?: string };
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? "Не вдалося завантажити команди");
      }
      setTeams(Array.isArray(body) ? body : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();
  }, []);

  const createTeam = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          number: Number(number) || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося створити команду");
      setName("");
      setNumber("");
      await loadTeams();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTeam = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося видалити команду");
      setTeams((prev) => prev.filter((team) => team._id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingName.trim(),
          number: Number(editingNumber),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося оновити команду");
      setEditingId(null);
      setEditingName("");
      setEditingNumber("");
      await loadTeams();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Адмін-панель
      </Link>

      <h1 className="text-3xl font-black text-white mb-8">Керування командами</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Додати команду</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Назва команди"
            className="sm:col-span-2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            min={1}
            max={999}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="№"
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
        </div>
        <Button type="button" className="mt-3" onClick={createTeam} disabled={isSubmitting}>
          {isSubmitting ? "Додавання..." : "Додати"}
        </Button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {isLoading && <Loader />}

      {!isLoading && (
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              {editingId === team._id ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="sm:col-span-2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={editingNumber}
                    onChange={(e) => setEditingNumber(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                  />
                  <div className="sm:col-span-3 flex gap-2 mt-1">
                    <Button size="sm" onClick={saveEdit} disabled={isSubmitting}>
                      Зберегти
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                        setEditingNumber("");
                      }}
                    >
                      Скасувати
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-zinc-500 text-sm font-mono mr-2">#{team.number}</span>
                    <span className="text-white font-semibold">{team.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(team._id);
                        setEditingName(team.name);
                        setEditingNumber(String(team.number));
                      }}
                    >
                      Редагувати
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void deleteTeam(team._id)}>
                      Видалити
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {teams.length === 0 && <p className="text-zinc-500">Команди ще не додані.</p>}
        </div>
      )}
    </main>
  );
}
