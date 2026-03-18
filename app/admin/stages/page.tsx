"use client";

import { useEffect, useMemo, useState } from "react";
import { useStages } from "@/app/hooks/useStages";
import { usePilots } from "@/app/hooks/usePilots";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { useStagesStore } from "@/store/stagesStore";
import { Loader, Button, Badge, Card } from "@/app/components/ui";
import { apiFetch } from "@/app/services/api/request";
import { getPointsByPosition } from "@/lib/utils/championship";
import { formatPilotFullName } from "@/lib/utils/pilotName";
import { getPreferredUiChampionshipId, sortSprintFirst } from "@/lib/utils/uiChampionship";
import { StageResult } from "@/types";
import Link from "next/link";

interface ResultInputRow {
  pilotId: string;
  position: number;
  dnf: boolean;
  dns: boolean;
  bestLap: boolean;
  penaltyPoints: number;
  penaltyReason: string;
}

export default function AdminStagesPage() {
  const {
    active,
  } = useChampionshipsCatalog();
  const activeChampionships = sortSprintFirst(active);
  const [selectedChampionshipIdState, setSelectedChampionshipIdState] = useState("");
  const selectedChampionshipId = useMemo(() => {
    if (
      selectedChampionshipIdState &&
      activeChampionships.some((item) => item._id === selectedChampionshipIdState)
    ) {
      return selectedChampionshipIdState;
    }
    return getPreferredUiChampionshipId(activeChampionships);
  }, [activeChampionships, selectedChampionshipIdState]);
  const selectedChampionship = activeChampionships.find(
    (item) => item._id === selectedChampionshipId,
  );
  const fastestLapBonusEnabled = Boolean(
    selectedChampionship?.fastestLapBonusEnabled,
  );
  const { stages, isLoading, error, deleteStage, updateStage, refresh } = useStages(
    selectedChampionshipId || undefined,
    { enabled: Boolean(selectedChampionshipId) },
  );
  const { pilots } = usePilots(selectedChampionshipId || undefined);
  // include all pilots in editable result lists (do not exclude 'pro')
  const editablePilots = pilots;
  const { saveStageResults } = useStagesStore();

  const [stageName, setStageName] = useState("");
  const [stageNumber, setStageNumber] = useState("");
  const [stageDate, setStageDate] = useState("");
  const [swsLinks, setSwsLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [resultsError, setResultsError] = useState("");
  const [sendingResultsStageId, setSendingResultsStageId] = useState<string | null>(null);
  const [sendingNewsStageId, setSendingNewsStageId] = useState<string | null>(null);

  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [resultsRows, setResultsRows] = useState<ResultInputRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkPenaltyPoints, setBulkPenaltyPoints] = useState(0);
  const [bulkPenaltyReason, setBulkPenaltyReason] = useState("");
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [role, setRole] = useState<"organizer" | "marshal" | "editor" | null>(null);
  const [participantsMap, setParticipantsMap] = useState<Record<string, { total: number; byRacesCount: { 1: number; 2: number; }; }>>({});

  const FORM_DRAFT_KEY = "admin:stages:form-draft:v1";

  useEffect(() => {
    let cancelled = false;
    if (!selectedChampionshipId) return;
    const fetchAll = async () => {
      try {
        const map: Record<string, any> = {};
        await Promise.all(
          stages.map(async (s) => {
            try {
              const res = await apiFetch(`/api/admin/stages/${s._id}/participants`, { cache: "no-store" });
              if (!res.ok) return;
              const data = await res.json();
              if (cancelled) return;
              map[s._id] = data;
            } catch {
              // ignore per-stage errors
            }
          }),
        );
        if (!cancelled) setParticipantsMap(map);
      } catch {
        // ignore
      }
    };

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [stages, selectedChampionshipId]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { role: "organizer" | "marshal" | "editor" | null; };
        setRole(data.role ?? null);
      } catch {
        setRole(null);
      }
    })();
  }, []);

  const canManageStages = role === "organizer";
  const canEditResults = role === "organizer" || role === "marshal";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FORM_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        stageName?: string;
        stageNumber?: string;
        stageDate?: string;
        swsLinks?: string[];
      };
      if (typeof draft.stageName === "string") setStageName(draft.stageName);
      if (typeof draft.stageNumber === "string") setStageNumber(draft.stageNumber);
      if (typeof draft.stageDate === "string") setStageDate(draft.stageDate);
      if (Array.isArray(draft.swsLinks) && draft.swsLinks.length > 0) setSwsLinks(draft.swsLinks);
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      FORM_DRAFT_KEY,
      JSON.stringify({ stageName, stageNumber, stageDate, swsLinks }),
    );
    setHasDraftChanges(Boolean(stageName.trim() || stageNumber || stageDate || swsLinks.some((s) => s.trim() !== "")));
  }, [stageName, stageNumber, stageDate, swsLinks]);

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChampionshipId) {
      setFormError("Оберіть чемпіонат, до якого треба додати етап.");
      return;
    }
    if (stages.some((s) => s.number === Number(stageNumber))) {
      setFormError(`Етап з номером ${stageNumber} вже існує`);
      return;
    }

    // validate swsLinks
    const validLinks = swsLinks.map((s) => (s ?? "")).map((s) => s.trim()).filter((s) => s !== "");
    if (validLinks.length === 0) {
      setFormError("Додайте хоча б одне посилання на SWS");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const res = await apiFetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          championshipId: selectedChampionshipId,
          name: stageName.trim(),
          number: Number(stageNumber),
          date: stageDate,
          swsLinks: validLinks,
        }),
      });
      const created = (await res.json().catch(() => ({}))) as { error?: string; _id?: string; };
      if (!res.ok) throw new Error(created.error ?? "Помилка додавання етапу");

      // Do not send Telegram news automatically when a stage is created.
      // Sending should be done manually via the per-stage "Send news" button in the list.

      setStageName("");
      setStageNumber("");
      setStageDate("");
      setSwsLinks([""]);
      localStorage.removeItem(FORM_DRAFT_KEY);
      setHasDraftChanges(false);
      await refresh();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendStageResultsToTelegram = async (stageId: string) => {
    setSendingResultsStageId(stageId);
    setFormError("");
    setResultsError("");
    try {
      const res = await apiFetch(`/api/telegram/stages/${stageId}/results`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося відправити результати в Telegram");
    } catch (err) {
      setResultsError((err as Error).message);
    } finally {
      setSendingResultsStageId(null);
    }
  };

  const sendNewStageToTelegram = async (stageId: string) => {
    setFormError("");
    setSendingNewsStageId(stageId);
    try {
      const res = await apiFetch(`/api/telegram/stages/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося відправити новину в Telegram");
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSendingNewsStageId(null);
    }
  };

  const extractPilotId = (result: StageResult): string => {
    if (result.pilot?._id) return result.pilot._id;
    const rid = result.pilotId as unknown;
    if (rid !== null && typeof rid === "object" && "_id" in (rid as Record<string, unknown>)) {
      return String((rid as { _id: unknown; })._id);
    }
    return String(result.pilotId);
  };

  const startEditResults = (stageId: string, existingResults?: StageResult[]) => {
    setResultsError("");
    setEditingStageId(stageId);
    setResultsRows(
      editablePilots.map((p, i) => {
        const existing = existingResults?.find((r) => extractPilotId(r) === p._id);
        if (existing) {
          return {
            pilotId: p._id,
            position: existing.position,
            dnf: existing.dnf,
            dns: existing.dns,
            bestLap: Boolean(existing.bestLap),
            penaltyPoints: existing.penaltyPoints ?? 0,
            penaltyReason: existing.penaltyReason ?? "",
          };
        }
        return {
          pilotId: p._id,
          position: i + 1,
          dnf: false,
          dns: false,
          bestLap: false,
          penaltyPoints: 0,
          penaltyReason: "",
        };
      }),
    );
    setSelectedRows([]);
    setBulkPenaltyPoints(0);
    setBulkPenaltyReason("");
  };

  const applyPreviousStageTemplate = (stageId: string) => {
    const stage = stages.find((s) => s._id === stageId);
    if (!stage) return;

    const previous = [...stages]
      .filter((s) => s.number < stage.number && s.isCompleted && s.results.length > 0)
      .sort((a, b) => b.number - a.number)[0];

    if (!previous) {
      setResultsError("Немає попереднього завершеного етапу з результатами для шаблону.");
      return;
    }

    setEditingStageId(stageId);
    setResultsRows(
      editablePilots.map((pilot, index) => {
        const prev = previous.results.find((r) => extractPilotId(r) === pilot._id);
        return {
          pilotId: pilot._id,
          position: prev?.position ?? index + 1,
          dnf: prev?.dnf ?? false,
          dns: prev?.dns ?? false,
          bestLap: Boolean(prev?.bestLap),
          penaltyPoints: 0,
          penaltyReason: "",
        };
      }),
    );
    setSelectedRows([]);
    setBulkPenaltyPoints(0);
    setBulkPenaltyReason("");
  };

  const toggleSelectRow = (pilotId: string) => {
    setSelectedRows((prev) =>
      prev.includes(pilotId) ? prev.filter((id) => id !== pilotId) : [...prev, pilotId],
    );
  };

  const selectAllRows = () => {
    setSelectedRows(resultsRows.map((row) => row.pilotId));
  };

  const clearSelection = () => {
    setSelectedRows([]);
  };

  const applyBulkState = (state: "dnf" | "dns") => {
    if (selectedRows.length === 0) {
      setResultsError("Оберіть хоча б одного учасника для масової дії.");
      return;
    }

    setResultsRows((rows) =>
      rows.map((row) => {
        if (!selectedRows.includes(row.pilotId)) return row;
        if (state === "dnf") {
          return { ...row, dnf: true, dns: false, bestLap: false };
        }
        return { ...row, dns: true, dnf: false, bestLap: false, position: 999 };
      }),
    );
  };

  const applyBulkPenalty = () => {
    if (selectedRows.length === 0) {
      setResultsError("Оберіть хоча б одного учасника для масового штрафу.");
      return;
    }
    if (bulkPenaltyPoints <= 0) {
      setResultsError("Вкажіть штраф більше 0.");
      return;
    }
    if (!bulkPenaltyReason.trim()) {
      setResultsError("Вкажіть причину масового штрафу.");
      return;
    }

    setResultsRows((rows) =>
      rows.map((row) =>
        selectedRows.includes(row.pilotId)
          ? {
            ...row,
            penaltyPoints: bulkPenaltyPoints,
            penaltyReason: bulkPenaltyReason.trim(),
          }
          : row,
      ),
    );
  };

  const updateRow = (
    pilotId: string,
    field: keyof ResultInputRow,
    value: number | boolean | string,
  ) => {
    setResultsRows((rows) => {
      const updatedRows = rows.map((r) => {
        if (r.pilotId !== pilotId) return r;
        const updated = { ...r, [field]: value };
        if (field === "dnf" && value) {
          updated.dns = false;
          updated.bestLap = false;
        }
        if (field === "dns" && value) {
          updated.dnf = false;
          updated.bestLap = false;
        }
        return updated;
      });

      if (field !== "bestLap" || value !== true) {
        return updatedRows;
      }

      return updatedRows.map((r) =>
        r.pilotId === pilotId ? r : { ...r, bestLap: false },
      );
    });
  };

  const handleSaveResults = async () => {
    if (!editingStageId) return;

    const activeRows = resultsRows.filter((r) => !r.dnf && !r.dns);
    // Validate uniqueness of positions per league (allow same position across leagues)
    const rowsByLeague: Record<string, number[]> = {};
    for (const r of activeRows) {
      const pilot = editablePilots.find((p) => p._id === r.pilotId) || pilots.find((p) => p._id === r.pilotId);
      const league = (pilot?.league as string) ?? "newbie";
      rowsByLeague[league] = rowsByLeague[league] ?? [];
      rowsByLeague[league].push(r.position);
    }
    for (const [league, posArr] of Object.entries(rowsByLeague)) {
      if (posArr.length !== new Set(posArr).size) {
        const leagueLabel = league === "pro" ? "Про" : "Новачки";
        setResultsError(`У двох або більше пілотів однакове місце у ${leagueLabel}. Виправте результати.`);
        return;
      }
    }

    const invalidPenaltyRow = resultsRows.find(
      (r) => r.penaltyPoints > 0 && !r.penaltyReason.trim(),
    );
    if (invalidPenaltyRow) {
      const pilot = pilots.find((p) => p._id === invalidPenaltyRow.pilotId);
      setResultsError(
        `Для штрафу пілота #${pilot?.number ?? "?"} ${pilot ? formatPilotFullName(pilot.name, pilot.surname) : ""} потрібно вказати причину.`,
      );
      return;
    }

    const bestLapRows = resultsRows.filter((r) => r.bestLap);
    if (fastestLapBonusEnabled && bestLapRows.length > 1) {
      setResultsError("Best lap може бути лише у одного пілота/команди за етап.");
      return;
    }

    setResultsError("");
    setSubmitting(true);
    try {
      const enriched = resultsRows.map((r) => {
        const pilot = editablePilots.find((p) => p._id === r.pilotId) || pilots.find((p) => p._id === r.pilotId);
        const league = (pilot?.league as "pro" | "newbie") ?? "newbie";
        const base = r.dnf || r.dns ? 0 : getPointsByPosition(r.position, league);
        const fastest = fastestLapBonusEnabled && r.bestLap ? 1 : 0;
        return { ...r, points: base + fastest - (r.penaltyPoints ?? 0) };
      });
      await saveStageResults(editingStageId, enriched, selectedChampionshipId || undefined);
      setEditingStageId(null);
    } catch (err) {
      setResultsError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {resultsError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-900 p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400 mb-2">
              Помилка результатів
            </p>
            <h2 className="text-xl font-bold text-white mb-3">Не вдалося зберегти результати</h2>
            <p className="text-sm leading-6 text-zinc-300">{resultsError}</p>
            <div className="mt-5 flex justify-end">
              <Button variant="secondary" onClick={() => setResultsError("")}>
                Зрозуміло
              </Button>
            </div>
          </div>
        </div>
      )}

      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Адмін-панель
      </Link>
      <h1 className="text-3xl font-black text-white mb-8">Етапи</h1>
      {hasDraftChanges ? (
        <p className="text-xs text-amber-300 mb-4">Є незбережені зміни (чернетка зберігається автоматично).</p>
      ) : null}

      {activeChampionships.length > 1 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {activeChampionships.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => {
                setSelectedChampionshipIdState(item._id);
                setEditingStageId(null);
                setFormError("");
                setResultsError("");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${selectedChampionshipId === item._id
                ? "bg-red-600 border-red-600 text-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
            >
              {item.name}
              <span className="ml-2 text-xs opacity-70">
                {item.championshipType === "sprint-pro" ? "Sprint PRO" : "Sprint"}
              </span>
            </button>
          ))}
        </div>
      )}

      {canManageStages ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Додати етап</h2>
          {selectedChampionshipId ? (
            <p className="text-zinc-400 text-sm mb-4">
              Етап буде додано до чемпіонату: <span className="text-white font-medium">
                {selectedChampionship?.name}
              </span>
            </p>
          ) : (
            <p className="text-zinc-500 text-sm mb-4">Спочатку оберіть чемпіонат.</p>
          )}
          <form onSubmit={handleAddStage} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Назва етапу *"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              required
            />
            <input
              type="number"
              placeholder="Номер етапу *"
              value={stageNumber}
              onChange={(e) => setStageNumber(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              min={1}
              required
            />
            <input
              type="date"
              value={stageDate}
              onChange={(e) => setStageDate(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
              required
            />
            <div className="sm:col-span-2">
              <label className="text-zinc-400 text-sm mb-2 block">Посилання на гонку на SWS (обов&apos;язково)</label>
              <div className="space-y-2">
                {swsLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setSwsLinks((prev) => prev.map((p, i) => (i === idx ? e.target.value : p)))}
                      placeholder="https://sws.example/event/..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      required={idx === 0}
                    />
                    {swsLinks.length > 1 && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm text-zinc-300"
                        onClick={() => setSwsLinks((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Видалити
                      </button>
                    )}
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-sm text-white"
                    onClick={() => setSwsLinks((prev) => [...prev, ""])}
                  >
                    Додати посилання
                  </button>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={submitting || !selectedChampionshipId}>
                {submitting ? "Додавання..." : "Додати етап"}
              </Button>
              {/* Manual sending only: auto-send option removed */}
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <p className="text-zinc-300 text-sm">Режим маршала: доступно лише внесення результатів етапів.</p>
        </div>
      )}

      {isLoading && <Loader />}
      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="space-y-4">
        {stages.map((stage) => (
          <Card key={stage._id} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-zinc-500 text-sm font-mono">Етап {stage.number}</span>
                  <span className="font-bold text-white break-words">{stage.name}</span>
                  <Badge variant={stage.isCompleted ? "success" : "warning"}>
                    {stage.isCompleted ? "Завершено" : "Очікується"}
                  </Badge>
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                  📅 {new Date(stage.date).toLocaleDateString("uk-UA")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {participantsMap[stage._id] ? (
                  <div className="text-sm text-zinc-300 mr-2 text-right">
                    <div className="text-zinc-400 text-xs">Учасників {participantsMap[stage._id].total}</div>
                    <div className="text-zinc-400 text-xs">1 гонка: {participantsMap[stage._id].byRacesCount[1]} </div>
                    <div className="text-zinc-400 text-xs">2 гонки: {participantsMap[stage._id].byRacesCount[2]}</div>
                    {participantsMap[stage._id].total > 0 && (
                      <Link href={`/admin/stages/${stage._id}`} className="text-sm text-zinc-400 hover:text-white">Список пілотів</Link>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-300 mr-2 text-right">
                    <div className="text-zinc-400 text-xs">Учасників</div>
                    <div className="text-white font-semibold">{stage.results?.length ?? 0}</div>
                    <Link href={`/admin/stages/${stage._id}`} className="text-sm text-zinc-400 hover:text-white">Список пілотів</Link>
                  </div>
                )}

                {pilots.length > 0 && canEditResults && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => startEditResults(stage._id, stage.results)}
                  >
                    {stage.isCompleted ? "Редагувати результати" : "Внести результати"}
                  </Button>
                )}
                {stage.isCompleted && canManageStages && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => void sendStageResultsToTelegram(stage._id)}
                    disabled={sendingResultsStageId === stage._id}
                  >
                    {sendingResultsStageId === stage._id ? "Відправка..." : "Відправити результати етапу"}
                  </Button>
                )}
                {/* {pilots.length > 0 && canEditResults && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => applyPreviousStageTemplate(stage._id)}
                  >
                    Копіювати попередній етап
                  </Button>
                )} */}
                {!stage.isCompleted && canManageStages && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => updateStage(stage._id, { isCompleted: true })}
                  >
                    Завершити етап
                  </Button>
                )}
                {canManageStages && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => deleteStage(stage._id)}
                  >
                    Видалити
                  </Button>
                )}
                {canManageStages && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => void sendNewStageToTelegram(stage._id)}
                    disabled={sendingNewsStageId === stage._id}
                  >
                    {sendingNewsStageId === stage._id ? "Відправка..." : "Відправити новину про етап"}
                  </Button>
                )}
              </div>

            </div>

            {editingStageId === stage._id && (
              <div className="mt-4 border-t border-zinc-700 pt-4">
                <h3 className="text-white font-semibold mb-3">Результати гонки</h3>
                {fastestLapBonusEnabled ? (
                  <p className="text-zinc-400 text-xs mb-3">
                    Увімкнено правило: <span className="text-zinc-200">Best lap = +1 очко</span>. Можна обрати тільки одного учасника.
                  </p>
                ) : (
                  <p className="text-zinc-500 text-xs mb-3">Правило Best lap у цьому чемпіонаті вимкнено.</p>
                )}

                <div className="mb-3 flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                    const sorted = [...pilots].sort((a, b) => a.number - b.number);
                    setResultsRows((rows) => rows.map((row) => ({ ...row, position: sorted.findIndex((p) => p._id === row.pilotId) + 1, dnf: false, dns: false })));
                  }}>
                    Авто-розстановка за номером
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setResultsRows((rows) => rows.map((row) => ({ ...row, penaltyPoints: 0, penaltyReason: "" })))}>
                    Очистити всі штрафи
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setResultsRows((rows) => rows.map((row) => ({ ...row, dns: true, dnf: false, bestLap: false, position: 999 })))}>
                    Позначити всіх як DNS
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAllRows}>Обрати всіх</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>Очистити вибір</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyBulkState("dnf")}>Масово DNF (обрані)</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => applyBulkState("dns")}>Масово DNS (обрані)</Button>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 p-3">
                  <span className="text-xs text-zinc-400">Масовий штраф для обраних:</span>
                  <input type="number" min={1} value={bulkPenaltyPoints} onChange={(e) => setBulkPenaltyPoints(Math.max(0, Number(e.target.value) || 0))} className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm text-center" />
                  <input type="text" value={bulkPenaltyReason} onChange={(e) => setBulkPenaltyReason(e.target.value)} placeholder="Причина" className="min-w-56 flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm" />
                  <Button type="button" variant="secondary" size="sm" onClick={applyBulkPenalty}>Застосувати</Button>
                  <span className="text-xs text-zinc-500">Обрано: {selectedRows.length}</span>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const sorted = [...resultsRows].sort((a, b) => a.position - b.position);

                    const proRows = sorted.filter((r) => {
                      const pilot = editablePilots.find((p) => p._id === r.pilotId) || pilots.find((p) => p._id === r.pilotId);
                      return (pilot?.league ?? "newbie") === "pro";
                    });
                    const newbieRows = sorted.filter((r) => {
                      const pilot = editablePilots.find((p) => p._id === r.pilotId) || pilots.find((p) => p._id === r.pilotId);
                      return (pilot?.league ?? "newbie") === "newbie";
                    });

                    const renderRow = (row: any) => {
                      const pilot = editablePilots.find((p) => p._id === row.pilotId) || pilots.find((p) => p._id === row.pilotId);
                      const league = (pilot?.league as "pro" | "newbie") ?? "newbie";
                      const basePoints = row.dnf || row.dns ? 0 : getPointsByPosition(row.position, league);
                      const pts = basePoints + (fastestLapBonusEnabled && row.bestLap ? 1 : 0) - row.penaltyPoints;
                      return (
                        <div key={row.pilotId} className="flex items-center gap-3 flex-wrap">
                          <label className="flex items-center gap-1 text-xs text-zinc-400">
                            <input type="checkbox" checked={selectedRows.includes(row.pilotId)} onChange={() => toggleSelectRow(row.pilotId)} className="accent-[#ccff00]" /> Обрати
                          </label>
                          <span className="text-white w-40 shrink-0 text-sm">#{pilot?.number} {pilot ? formatPilotFullName(pilot.name, pilot.surname) : ""}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-zinc-500 text-xs">Місце:</span>
                            <input type="number" value={row.position} min={1} max={pilots.length} onChange={(e) => updateRow(row.pilotId, "position", Number(e.target.value))} className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm text-center" />
                          </div>
                          <label className="flex items-center gap-1 text-sm text-zinc-400"><input type="checkbox" checked={row.dnf} onChange={(e) => updateRow(row.pilotId, "dnf", e.target.checked)} className="accent-red-500" /> DNF</label>
                          <label className="flex items-center gap-1 text-sm text-zinc-400"><input type="checkbox" checked={row.dns} onChange={(e) => updateRow(row.pilotId, "dns", e.target.checked)} className="accent-red-500" /> DNS</label>
                          {fastestLapBonusEnabled && (<label className="flex items-center gap-1 text-sm text-zinc-300"><input type="checkbox" checked={row.bestLap} onChange={(e) => updateRow(row.pilotId, "bestLap", e.target.checked)} className="accent-red-500" /> Best lap (+1)</label>)}
                          <div className="flex items-center gap-1"><span className="text-zinc-500 text-xs">Штраф:</span><input type="number" value={row.penaltyPoints} min={0} onChange={(e) => updateRow(row.pilotId, "penaltyPoints", Math.max(0, Number(e.target.value) || 0))} className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm text-center" /></div>
                          <input type="text" value={row.penaltyReason} onChange={(e) => updateRow(row.pilotId, "penaltyReason", e.target.value)} placeholder="Причина штрафу" className="min-w-44 flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm" />
                          <span className="text-zinc-500 text-xs ml-auto">{pts} очк.</span>
                        </div>
                      );
                    };

                    return (
                      <>
                        <div className="rounded-lg border border-zinc-800 p-3 bg-zinc-900">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">Про</h4>
                            <span className="text-xs text-zinc-400">{proRows.length} обрано</span>
                          </div>
                          <div className="space-y-2">{proRows.map(renderRow)}</div>
                        </div>

                        <div className="rounded-lg border border-zinc-800 p-3 bg-zinc-900">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">Новачки</h4>
                            <span className="text-xs text-zinc-400">{newbieRows.length} обрано</span>
                          </div>
                          <div className="space-y-2">{newbieRows.map(renderRow)}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex gap-3 mt-4">
                  <Button onClick={handleSaveResults} disabled={submitting}>{submitting ? "Збереження..." : "Зберегти результати"}</Button>
                  <Button variant="ghost" onClick={() => { setEditingStageId(null); setResultsError(""); }}>Скасувати</Button>
                </div>
              </div>
            )}

          </Card>
        ))}
      </div>
    </main>
  );
}
