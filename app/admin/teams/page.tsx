"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { Button } from "@/app/components/ui/Button";
import { Loader } from "@/app/components/ui/Loader";
import { apiFetch } from "@/app/services/api/request";
import { Team } from "@/types";

type ChampionshipType = "solo" | "teams" | "sprint-pro";

export default function AdminTeamsPage() {
  return (
    <Suspense fallback={<AdminTeamsPageFallback />}>
      <AdminTeamsPageContent />
    </Suspense>
  );
}

function AdminTeamsPageFallback() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Loader />
    </main>
  );
}

function AdminTeamsPageContent() {
  const searchParams = useSearchParams();
  const championshipId = searchParams.get("championship") ?? undefined;
  const { active } = useChampionshipsCatalog({ enabled: Boolean(championshipId) });
  const selectedChampionship = championshipId
    ? active.find((item) => item._id === championshipId)
    : null;

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const championshipName = selectedChampionship?.name ?? "";
  const championshipType: ChampionshipType =
    selectedChampionship?.championshipType === "solo" ? "solo" : "teams";

  useEffect(() => {
    const loadTeams = async () => {
      if (!championshipId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const res = await apiFetch(`/api/teams?championship=${encodeURIComponent(championshipId)}`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => [])) as Team[] | { error?: string; };
        if (!res.ok) {
          throw new Error((body as { error?: string; }).error ?? "Не вдалося завантажити команди");
        }
        setTeams(Array.isArray(body) ? body : []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTeams();
  }, [championshipId]);

  const handleDelete = async (teamId: string) => {
    if (!championshipId) return;
    setDeletingId(teamId);
    setError("");

    try {
      const res = await apiFetch(
        `/api/teams/${teamId}?championship=${encodeURIComponent(championshipId)}`,
        { method: "DELETE" },
      );
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) {
        throw new Error(body.error ?? "Не вдалося видалити команду");
      }
      setTeams((prev) => prev.filter((team) => team._id !== teamId));
      if (expandedId === teamId) {
        setExpandedId(null);
      }
    } catch (err) {
      setError((err as Error).message);
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

  if (championshipType === "solo") {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-zinc-400">Для solo-чемпіонату використовуйте керування пілотами.</p>
        <Link
          href={`/admin/pilots?championship=${encodeURIComponent(championshipId)}`}
          className="text-red-400 underline mt-4 block"
        >
          ← До пілотів
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
        <h1 className="text-3xl font-black text-white">Команди</h1>
        <p className="text-zinc-400 mt-1">Чемпіонат: {championshipName || "обраний чемпіонат"}</p>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {isLoading && <Loader />}

      {!isLoading && (
        <div className="space-y-2">
          {teams.map((team) => {
            const isExpanded = expandedId === team._id;

            return (
              <div key={team._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : team._id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="text-zinc-500 text-sm font-mono mr-2">#{team.number}</span>
                    <span className="text-white font-semibold">{team.name}</span>
                    <p className="text-zinc-400 text-xs mt-1">
                      {isExpanded ? "Сховати інформацію" : "Переглянути інформацію"}
                    </p>
                  </button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDelete(team._id)}
                    disabled={deletingId === team._id}
                  >
                    {deletingId === team._id ? "Видалення..." : "Видалити"}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-zinc-800 pt-4 text-sm text-zinc-300 space-y-1">
                    <p>Назва: {team.name}</p>
                    <p>Номер: #{team.number}</p>
                    <p>Телефон: {team.phone || "не вказано"}</p>
                    <p>Формат команди: {team.isSolo === false ? "Кілька пілотів" : "Solo"}</p>
                    {team.drivers && team.drivers.length > 0 ? (
                      <div>
                        <p className="text-zinc-400">Склад:</p>
                        <ul className="list-disc list-inside">
                          {team.drivers.map((driver, index) => (
                            <li key={`${team._id}-driver-${index}`}>
                              {driver.name} {driver.surname}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p>Склад: не вказано</p>
                    )}
                    <p>ID: {team._id}</p>
                  </div>
                )}
              </div>
            );
          })}

          {teams.length === 0 && <p className="text-zinc-500">Команди ще не додані.</p>}
        </div>
      )}
    </main>
  );
}
