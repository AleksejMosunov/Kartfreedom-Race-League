"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { useStages } from "@/app/hooks/useStages";
import { Button, Loader, Card } from "@/app/components/ui";
import { apiFetch } from "@/app/services/api/request";
import { formatPilotFullName } from "@/lib/utils/pilotName";

// ChampionshipType type removed — not used in this module

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
  // championshipType removed — not used in this view
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { stages } = useStages(championshipId, { enabled: Boolean(championshipId) });
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [groupsCount, setGroupsCount] = useState<number>(2);
  const [dnsSet] = useState<Set<string>>(() => new Set());
  const [creatingGroups, setCreatingGroups] = useState(false);
  // `hasGroups` state removed — not read anywhere. Keep network checks but don't store state.
  const [deletingGroups, setDeletingGroups] = useState(false);

  // check for existing sprint groups for the selected stage
  useEffect(() => {
    async function checkGroups() {
      if (!selectedStageId) return;
      try {
        const res = await apiFetch(`/api/stages/${selectedStageId}/sprint-groups`, { cache: "no-store" });
        if (!res.ok) return;
        await res.json();
      } catch {
        // ignore errors for group check
      }
    }
    checkGroups();
  }, [selectedStageId]);

  const handleDelete = async (pilotId: string) => {
    if (!championshipId) return;
    setDeleteError("");
    setDeletingId(pilotId);

    try {
      const res = await apiFetch(
        `/api/pilots/${pilotId}?championship=${encodeURIComponent(championshipId ?? "")}`,
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
            <Card key={pilot._id} className="flex items-center justify-between gap-3">
              <Link href={`/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId ?? "")}`} className="min-w-0 flex-1">
                <div>
                  <span className="text-zinc-500 text-sm font-mono mr-2">#{pilot.number}</span>
                  <span className="text-white font-semibold">{formatPilotFullName(pilot.name, pilot.surname)}</span>
                  <p className="text-zinc-400 text-xs mt-1">Переглянути інформацію</p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <select
                  value={pilot.league ?? "newbie"}
                  onChange={async (e) => {
                    if (!championshipId) return;
                    setUpdateError("");
                    setUpdatingId(pilot._id);
                    try {
                      const res = await apiFetch(
                        `/api/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId)}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ league: e.target.value }),
                        },
                      );
                      const body = (await res.json().catch(() => ({}))) as { error?: string; };
                      if (!res.ok) throw new Error(body.error ?? "Не вдалося оновити пілота");
                      await refresh();
                    } catch (err) {
                      setUpdateError((err as Error).message);
                    } finally {
                      setUpdatingId(null);
                    }
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-white text-sm"
                  disabled={updatingId === pilot._id}
                >
                  <option value="pro">Про</option>
                  <option value="newbie">Новачки</option>
                </select>

                <Button size="sm" variant="danger" onClick={() => void handleDelete(pilot._id)} disabled={deletingId === pilot._id}>
                  {deletingId === pilot._id ? "Видалення..." : "Видалити"}
                </Button>
              </div>
            </Card>
          ))}

          {/* Sprint grouping tool (admin) */}
          {pilots.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="text-white font-semibold mb-2">Sprint — розподіл груп</h2>
              <div className="flex gap-2 items-center mb-2">
                <label className="text-zinc-400 text-sm">Етап:</label>
                <select
                  value={selectedStageId ?? ""}
                  onChange={(e) => setSelectedStageId(e.target.value || null)}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-white text-sm"
                >
                  <option value="">Обрати етап</option>
                  {stages
                    .filter((s) => !s.isCompleted)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.number} — {s.name}
                      </option>
                    ))}
                </select>

                <label className="text-zinc-400 text-sm">Кількість груп:</label>
                <input
                  type="number"
                  min={1}
                  value={groupsCount}
                  onChange={(e) => setGroupsCount(Number(e.target.value))}
                  className="w-20 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-white text-sm"
                />
              </div>

              <p className="text-zinc-400 text-sm mb-2">Позначте пілотів, які не їдуть на цьому етапі (будуть відмічені DNS):</p>
              <div className="max-h-44 overflow-auto grid grid-cols-2 gap-2 mb-3">
                {pilots.map((pilot) => (
                  <label key={pilot._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) dnsSet.add(pilot._id);
                        else dnsSet.delete(pilot._id);
                      }}
                    />
                    <span className="text-zinc-300">#{pilot.number} — {formatPilotFullName(pilot.name, pilot.surname)}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!championshipId) return;
                    if (!selectedStageId) {
                      setUpdateError("Оберіть етап");
                      return;
                    }
                    setCreatingGroups(true);
                    try {
                      const res = await apiFetch(`/api/admin/sprint-groups`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          stageId: selectedStageId,
                          groupsCount,
                          pilotIds: pilots.map((p) => p._id),
                          dnsPilotIds: Array.from(dnsSet),
                        }),
                      });
                      const body = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(body.error ?? "Не вдалося створити групи");
                      await refresh();
                      setUpdateError("");
                      // optionally show result

                      alert("Групи створено успішно");
                    } catch (err) {
                      setUpdateError((err as Error).message);
                    } finally {
                      setCreatingGroups(false);
                    }
                  }}
                  disabled={creatingGroups}
                >
                  {creatingGroups ? "Створення..." : "Створити групи"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (!championshipId) return;
                    if (!selectedStageId) {
                      setUpdateError("Оберіть етап");
                      return;
                    }
                    if (!confirm("Видалити розподіл груп для цього етапу?")) return;
                    setDeletingGroups(true);
                    try {
                      const res = await apiFetch(
                        `/api/admin/sprint-groups?stageId=${encodeURIComponent(selectedStageId)}&clearDns=1`,
                        { method: "DELETE" },
                      );
                      const body = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(body.error ?? "Не вдалося видалити групи");
                      alert("Групи видалено");
                    } catch (err) {
                      setUpdateError((err as Error).message);
                    } finally {
                      setDeletingGroups(false);
                    }
                  }}
                  disabled={deletingGroups}
                >
                  {deletingGroups ? "Видалення..." : "Видалити групи"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { dnsSet.clear(); setSelectedStageId(null); }}>
                  Скинути
                </Button>
              </div>
              {updateError && <p className="text-red-400 text-sm mt-2">{updateError}</p>}
            </div>
          )}

          {pilots.length === 0 && <p className="text-zinc-500">Пілоти ще не додані.</p>}
        </div>
      )}
    </main>
  );
}
