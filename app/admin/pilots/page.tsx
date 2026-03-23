"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
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
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // stages and grouping UI removed from this view to avoid unused state
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [fieldsMap, setFieldsMap] = useState<Record<string, { swsId: string; phone: string; }>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (key: string, text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedMap((s) => ({ ...s, [key]: true }));
      setTimeout(() => setCopiedMap((s) => ({ ...s, [key]: false })), 1200);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const map: Record<string, { swsId: string; phone: string; }> = {};
    for (const p of pilots) {
      map[p._id] = { swsId: p.swsId ?? "", phone: p.phone ?? "" };
    }
    setFieldsMap(map);
  }, [pilots]);

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
      if (!res.ok) throw new Error(body.error ?? "Не вдалося видалити пілота");
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
      {updateError && <p className="text-red-400 text-sm mb-4">{updateError}</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {isLoading && <Loader />}

      {!isLoading && (
        <div className="space-y-2">
          {pilots.map((pilot) => (
            <Card key={pilot._id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div>
                  <span className="text-white font-semibold">{formatPilotFullName(pilot.name, pilot.surname)}</span>
                </div>

                <div className="mt-1 flex flex-wrap gap-4 text-sm text-zinc-300 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-xs">SWS:</span>
                    <input
                      value={fieldsMap[pilot._id]?.swsId ?? ""}
                      onChange={(e) => setFieldsMap((m) => ({ ...m, [pilot._id]: { ...(m[pilot._id] ?? { swsId: "", phone: "" }), swsId: e.target.value } }))}
                      placeholder="—"
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                    />
                    <button
                      type="button"
                      aria-label="Копіювати SWS"
                      onClick={() => copyToClipboard(`${pilot._id}:sws`, fieldsMap[pilot._id]?.swsId ?? pilot.swsId)}
                      className="ml-2 text-zinc-400 hover:text-white"
                    >
                      {copiedMap[`${pilot._id}:sws`] ? (
                        <span className="text-green-400 text-xs">Скопійовано</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-xs">Телефон:</span>
                    <input
                      value={fieldsMap[pilot._id]?.phone ?? ""}
                      onChange={(e) => setFieldsMap((m) => ({ ...m, [pilot._id]: { ...(m[pilot._id] ?? { swsId: "", phone: "" }), phone: e.target.value } }))}
                      placeholder="не вказано"
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                    />
                    <button
                      type="button"
                      aria-label="Копіювати телефон"
                      onClick={() => copyToClipboard(`${pilot._id}:phone`, fieldsMap[pilot._id]?.phone ?? pilot.phone)}
                      className="ml-2 text-zinc-400 hover:text-white"
                    >
                      {copiedMap[`${pilot._id}:phone`] ? (
                        <span className="text-green-400 text-xs">Скопійовано</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pilot.league ?? "newbie"}
                  onChange={async (e) => {
                    if (!championshipId) return;
                    setUpdateError("");
                    setUpdatingId(pilot._id);
                    try {
                      const res = await apiFetch(
                        `/api/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId ?? "")}`,
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

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      if (!championshipId) return;
                      setUpdateError("");
                      setUpdatingId(pilot._id);
                      try {
                        const body = {
                          swsId: fieldsMap[pilot._id]?.swsId ?? null,
                          phone: fieldsMap[pilot._id]?.phone ?? null,
                        };
                        const res = await apiFetch(`/api/pilots/${pilot._id}?championship=${encodeURIComponent(championshipId ?? "")}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        });
                        const resBody = (await res.json().catch(() => ({}))) as { error?: string; };
                        if (!res.ok) throw new Error(resBody.error ?? "Не вдалося оновити");
                        await refresh();
                        setSavedMap((s) => ({ ...s, [pilot._id]: true }));
                        setTimeout(() => setSavedMap((s) => ({ ...s, [pilot._id]: false })), 1600);
                      } catch (err) {
                        setUpdateError((err as Error).message);
                      } finally {
                        setUpdatingId(null);
                      }
                    }}
                    disabled={updatingId === pilot._id}
                  >
                    <span className="inline-flex items-center gap-2">
                      {updatingId === pilot._id && (
                        <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.15"></circle>
                          <path d="M22 12a10 10 0 0 1-10 10" strokeWidth="3"></path>
                        </svg>
                      )}
                      <span>{updatingId === pilot._id ? "Збереження..." : "Зберегти"}</span>
                    </span>
                  </Button>

                  {savedMap[pilot._id] && (
                    <span className="text-green-400 text-sm ml-2">✓ Збережено</span>
                  )}

                  <Button size="sm" variant="danger" onClick={() => void handleDelete(pilot._id)} disabled={deletingId === pilot._id}>
                    {deletingId === pilot._id ? "Видалення..." : "Видалити"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {pilots.length === 0 && <p className="text-zinc-500">Пілоти ще не додані.</p>}
        </div>
      )}
    </main>
  );
}
