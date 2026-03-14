"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { Button } from "@/app/components/ui/Button";
import { Loader } from "@/app/components/ui/Loader";
import { formatPilotFullName } from "@/lib/utils/pilotName";

type ChampionshipType = "solo" | "teams";

export default function AdminPilotsPage() {
  return (
    <Suspense fallback={<AdminPilotsPageFallback />}>
      <AdminPilotsPageContent />
    </Suspense>
  );
}

function AdminPilotsPageFallback() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Loader />
    </main>
  );
}

function AdminPilotsPageContent() {
  const searchParams = useSearchParams();
  const championshipId = searchParams.get("championship") ?? undefined;
  const { active } = useChampionshipsCatalog({ enabled: Boolean(championshipId) });
  const { pilots, isLoading, error, refresh } = usePilots(championshipId);
  const selectedChampionship = championshipId
    ? active.find((item) => item._id === championshipId)
    : null;

  const championshipName = selectedChampionship?.name ?? "";
  const championshipType: ChampionshipType =
    selectedChampionship?.championshipType === "teams" ? "teams" : "solo";
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (pilotId: string) => {
    if (!championshipId) return;
    setDeleteError("");
    setDeletingId(pilotId);

    try {
      const res = await fetch(
        `/api/pilots/${pilotId}?championship=${encodeURIComponent(championshipId)}`,
        { method: "DELETE" },
      );
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) {
        throw new Error(body.error ?? "Не вдалося видалити пілота");
      }
      await refresh();
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!championshipId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-zinc-400">Спочатку оберіть чемпіонат у розділі керування учасниками.</p>
        <Link href="/admin/participants" className="text-red-400 underline mt-4 block">
          ← До вибору чемпіонату
        </Link>
      </main>
    );
  }

  if (championshipType === "teams") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-zinc-400">Для Endurance-чемпіонату використовуйте керування командами.</p>
        <Link
          href={`/admin/teams?championship=${encodeURIComponent(championshipId)}`}
          className="text-red-400 underline mt-4 block"
        >
          ← До команд
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin/participants" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Керування учасниками
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Пілоти</h1>
        <p className="text-zinc-400 mt-1">Чемпіонат: {championshipName || "обраний чемпіонат"}</p>
      </div>

      {deleteError && <p className="text-red-400 text-sm mb-4">{deleteError}</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {isLoading && <Loader />}

      {!isLoading && (
        <div className="space-y-2">
          {pilots.map((pilot) => (
            <div key={pilot._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <Link href={`/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId)}`} className="min-w-0 flex-1">
                <div>
                  <span className="text-zinc-500 text-sm font-mono mr-2">#{pilot.number}</span>
                  <span className="text-white font-semibold">{formatPilotFullName(pilot.name, pilot.surname)}</span>
                  <p className="text-zinc-400 text-xs mt-1">Переглянути інформацію</p>
                </div>
              </Link>
              <Button size="sm" variant="danger" onClick={() => void handleDelete(pilot._id)} disabled={deletingId === pilot._id}>
                {deletingId === pilot._id ? "Видалення..." : "Видалити"}
              </Button>
            </div>
          ))}

          {pilots.length === 0 && <p className="text-zinc-500">Пілоти ще не додані.</p>}
        </div>
      )}
    </main>
  );
}
