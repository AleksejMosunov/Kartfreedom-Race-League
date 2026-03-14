"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Loader } from "@/app/components/ui/Loader";
import { defaultRegulationsForNewChampionship } from "@/lib/championship/regulations";
import { Championship, RegulationSection, RegulationsContent } from "@/types";

interface ChampionshipsResponse {
  active?: Championship[];
  current?: Championship | null;
  archived: Championship[];
  preseasonNews?: string;
  preseasonNewsByType?: {
    solo?: string;
    teams?: string;
  };
}

const emptySection: RegulationSection = { title: "", content: "" };

function emptyRegulations(): RegulationsContent {
  return { title: "", intro: "", sections: [emptySection] };
}

export default function AdminChampionshipsPage() {
  const [active, setActive] = useState<Championship[]>([]);
  const [archived, setArchived] = useState<Championship[]>([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"solo" | "teams">("solo");
  const [newFastestLapBonusEnabled, setNewFastestLapBonusEnabled] = useState(false);
  const [newRegulations, setNewRegulations] = useState<RegulationsContent>(
    defaultRegulationsForNewChampionship(false),
  );
  const [activeFastestLap, setActiveFastestLap] = useState<Record<string, boolean>>({});
  const [activeRegulations, setActiveRegulations] = useState<Record<string, RegulationsContent>>({});
  const [expandedRegChampId, setExpandedRegChampId] = useState<string | null>(null);
  const [preseasonNewsByType, setPreseasonNewsByType] = useState<{ solo: string; teams: string; }>({
    solo: "",
    teams: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [restorePreview, setRestorePreview] = useState<{
    id: string;
    name: string;
    participantsCount: number;
    stagesCount: number;
    leaders: string[];
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notifyStartInTelegram, setNotifyStartInTelegram] = useState(true);
  const [notifyFinishInTelegram, setNotifyFinishInTelegram] = useState(true);
  const [newPrizes, setNewPrizes] = useState<{ place: string; description: string; }[]>([
    { place: "1", description: "" },
  ]);
  const [activePrizes, setActivePrizes] = useState<Record<string, { place: string; description: string; }[]>>({});
  const [expandedPrizesChampId, setExpandedPrizesChampId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "new" | "archive">("active");
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  const DRAFT_KEY = "admin:championships:draft:v1";

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/championships");
      if (!res.ok) throw new Error("Не вдалося завантажити чемпіонати");
      const payload = (await res.json()) as ChampionshipsResponse;
      const activeList: Championship[] = payload.active ?? (payload.current ? [payload.current] : []);
      setActive(activeList);
      setArchived(payload.archived ?? []);
      setPreseasonNewsByType({
        solo: payload.preseasonNewsByType?.solo ?? payload.preseasonNews ?? "",
        teams: payload.preseasonNewsByType?.teams ?? "",
      });

      const fastestLapMap: Record<string, boolean> = {};
      const regulationsMap: Record<string, RegulationsContent> = {};
      for (const c of activeList) {
        fastestLapMap[c._id] = Boolean(c.fastestLapBonusEnabled);
        if (c.regulations) {
          regulationsMap[c._id] = {
            title: c.regulations.title,
            intro: c.regulations.intro,
            sections: c.regulations.sections.length > 0 ? c.regulations.sections : [emptySection],
          };
        } else {
          regulationsMap[c._id] = emptyRegulations();
        }
      }
      setActiveFastestLap(fastestLapMap);
      setActiveRegulations(regulationsMap);

      const prizesMap: Record<string, { place: string; description: string; }[]> = {};
      for (const c of activeList) {
        prizesMap[c._id] = (c.prizes ?? []).map((p) => ({ place: p.place, description: p.description }));
      }
      setActivePrizes(prizesMap);

      if (activeList.length === 0) {
        setExpandedRegChampId(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        newName?: string;
        newType?: "solo" | "teams";
        newFastestLapBonusEnabled?: boolean;
        newPrizes?: { place: string; description: string; }[];
        preseasonNewsByType?: { solo: string; teams: string; };
      };

      if (typeof draft.newName === "string") setNewName(draft.newName);
      if (draft.newType === "solo" || draft.newType === "teams") setNewType(draft.newType);
      if (typeof draft.newFastestLapBonusEnabled === "boolean") {
        setNewFastestLapBonusEnabled(draft.newFastestLapBonusEnabled);
      }
      if (Array.isArray(draft.newPrizes) && draft.newPrizes.length > 0) {
        setNewPrizes(draft.newPrizes);
      }
      if (draft.preseasonNewsByType) {
        setPreseasonNewsByType({
          solo: draft.preseasonNewsByType.solo ?? "",
          teams: draft.preseasonNewsByType.teams ?? "",
        });
      }
      setHasDraftChanges(true);
    } catch {
      // ignore broken draft payload
    }
  }, []);

  useEffect(() => {
    const payload = {
      newName,
      newType,
      newFastestLapBonusEnabled,
      newPrizes,
      preseasonNewsByType,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));

    const isDirty =
      Boolean(newName.trim()) ||
      newType !== "solo" ||
      newFastestLapBonusEnabled ||
      newPrizes.some((p) => p.place.trim() || p.description.trim()) ||
      Boolean(preseasonNewsByType.solo.trim()) ||
      Boolean(preseasonNewsByType.teams.trim());
    setHasDraftChanges(isDirty);
  }, [newName, newType, newFastestLapBonusEnabled, newPrizes, preseasonNewsByType]);

  const startNewChampionship = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    const cleanedSections = newRegulations.sections
      .map((section) => ({
        title: section.title.trim(),
        content: section.content.trim(),
      }))
      .filter((section) => section.title && section.content);

    if (!newRegulations.title.trim() || !newRegulations.intro.trim() || cleanedSections.length === 0) {
      setError("Заповніть дефолтний регламент: заголовок, вступ і хоча б один пункт");
      setIsSubmitting(false);
      return;
    }

    const validPrizes = newPrizes
      .filter((p) => p.place.trim() && p.description.trim())
      .map((p) => ({ place: p.place.trim(), description: p.description.trim() }));
    try {
      const res = await fetch("/api/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          championshipType: newType,
          fastestLapBonusEnabled: newFastestLapBonusEnabled,
          prizes: validPrizes,
          regulations: {
            title: newRegulations.title.trim(),
            intro: newRegulations.intro.trim(),
            sections: cleanedSections,
          },
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; _id?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося створити чемпіонат");

      let telegramWarning = "";
      if (notifyStartInTelegram && body._id) {
        try {
          const tgRes = await fetch("/api/telegram/championship/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ championshipId: body._id }),
          });
          const tgBody = (await tgRes.json().catch(() => ({}))) as { error?: string; };
          if (!tgRes.ok) {
            telegramWarning = ` Чемпіонат створено, але Telegram-новину не відправлено: ${tgBody.error ?? "невідома помилка"}.`;
          }
        } catch (err) {
          telegramWarning = ` Чемпіонат створено, але Telegram-новину не відправлено: ${(err as Error).message}.`;
        }
      }

      setNewName("");
      setNewType("solo");
      setNewFastestLapBonusEnabled(false);
      setNewRegulations(defaultRegulationsForNewChampionship(false));
      setNewPrizes([{ place: "1", description: "" }]);
      localStorage.removeItem(DRAFT_KEY);
      setHasDraftChanges(false);
      setSuccess(`Новий чемпіонат створено. Дані починаються з нуля.${telegramWarning}`);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveChampionshipSettings = async (id: string) => {
    setError("");
    setSuccess("");
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/championships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fastestLapBonusEnabled: activeFastestLap[id] ?? false,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося зберегти налаштування чемпіонату");
      setSuccess("Налаштування чемпіонату оновлено.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingId(null);
    }
  };

  const finishChampionship = async (id: string) => {
    setError("");
    setSuccess("");
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/championships/${id}/finish`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося завершити чемпіонат");

      let telegramWarning = "";
      if (notifyFinishInTelegram) {
        try {
          const tgRes = await fetch("/api/telegram/championship/finish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ championshipId: id }),
          });
          const tgBody = (await tgRes.json().catch(() => ({}))) as { error?: string; };
          if (!tgRes.ok) {
            telegramWarning = ` Telegram-новину про завершення не відправлено: ${tgBody.error ?? "невідома помилка"}.`;
          }
        } catch (err) {
          telegramWarning = ` Telegram-новину про завершення не відправлено: ${(err as Error).message}.`;
        }
      }

      setSuccess(`Чемпіонат завершено та перенесено в архів.${telegramWarning}`);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingId(null);
    }
  };

  const restoreArchivedChampionship = async (id: string) => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/championships/${id}/restore`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося відновити чемпіонат");
      setSuccess("Чемпіонат відновлено з архіву та зроблено активним.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deleteChampionship = async (id: string) => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/championships/${id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося видалити чемпіонат");
      setSuccess("Чемпіонат видалено з архіву.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
      setConfirmDeleteId(null);
    }
  };

  const openRestorePreview = async (id: string) => {
    setPreviewLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/championships/${id}`);
      if (!res.ok) throw new Error("Не вдалося завантажити preview");
      const body = (await res.json()) as {
        championship: { _id: string; name: string; };
        pilots: Array<{ name: string; surname?: string; }>;
        stages: Array<unknown>;
        standings: Array<{ pilot: { name: string; surname?: string; }; totalPoints: number; }>;
      };

      setRestorePreview({
        id: body.championship._id,
        name: body.championship.name,
        participantsCount: body.pilots.length,
        stagesCount: body.stages.length,
        leaders: body.standings.slice(0, 3).map((row) => `${row.pilot.name} ${row.pilot.surname ?? ""}`.trim()),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const savePreseasonNews = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/championships/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preseasonNews: preseasonNewsByType.solo,
          preseasonNewsByType: {
            solo: preseasonNewsByType.solo,
            teams: preseasonNewsByType.teams,
          },
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося зберегти новину");
      setSuccess("Новину збережено.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRegulationSection = (
    championshipId: string,
    index: number,
    field: keyof RegulationSection,
    value: string,
  ) => {
    setActiveRegulations((prev) => {
      const current = prev[championshipId] ?? emptyRegulations();
      return {
        ...prev,
        [championshipId]: {
          ...current,
          sections: current.sections.map((section, i) =>
            i === index ? { ...section, [field]: value } : section,
          ),
        },
      };
    });
  };

  const addRegulationSection = (championshipId: string) => {
    setActiveRegulations((prev) => {
      const current = prev[championshipId] ?? emptyRegulations();
      return {
        ...prev,
        [championshipId]: {
          ...current,
          sections: [...current.sections, { ...emptySection }],
        },
      };
    });
  };

  const removeRegulationSection = (championshipId: string, index: number) => {
    setActiveRegulations((prev) => {
      const current = prev[championshipId] ?? emptyRegulations();
      return {
        ...prev,
        [championshipId]: {
          ...current,
          sections:
            current.sections.length === 1
              ? [{ ...emptySection }]
              : current.sections.filter((_, i) => i !== index),
        },
      };
    });
  };

  const updateNewRegulationSection = (
    index: number,
    field: keyof RegulationSection,
    value: string,
  ) => {
    setNewRegulations((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const addNewRegulationSection = () => {
    setNewRegulations((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...emptySection }],
    }));
  };

  const removeNewRegulationSection = (index: number) => {
    setNewRegulations((prev) => ({
      ...prev,
      sections:
        prev.sections.length === 1
          ? [{ ...emptySection }]
          : prev.sections.filter((_, i) => i !== index),
    }));
  };

  const updateActivePrize = (
    champId: string,
    index: number,
    field: "place" | "description",
    value: string,
  ) => {
    setActivePrizes((prev) => ({
      ...prev,
      [champId]: (prev[champId] ?? []).map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const removePrize = (champId: string, index: number) => {
    setActivePrizes((prev) => ({
      ...prev,
      [champId]: (prev[champId] ?? []).filter((_, i) => i !== index),
    }));
  };

  const savePrizes = async (id: string) => {
    const prizes = (activePrizes[id] ?? [])
      .filter((p) => p.place.trim() && p.description.trim())
      .map((p) => ({ place: p.place.trim(), description: p.description.trim() }));
    setError("");
    setSuccess("");
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/championships/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizes }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося зберегти призи");
      setSuccess("Призи чемпіонату оновлено.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingId(null);
    }
  };

  const saveChampionshipRegulations = async (id: string) => {
    const regulations = activeRegulations[id] ?? emptyRegulations();

    const cleanedSections = regulations.sections
      .map((section) => ({
        title: section.title.trim(),
        content: section.content.trim(),
      }))
      .filter((section) => section.title && section.content);

    if (!regulations.title.trim() || !regulations.intro.trim() || cleanedSections.length === 0) {
      setError("Заповніть заголовок, опис і хоча б один пункт регламенту");
      return;
    }

    setError("");
    setSuccess("");
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/championships/${id}/regulations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: regulations.title.trim(),
          intro: regulations.intro.trim(),
          sections: cleanedSections,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося зберегти регламент");

      setSuccess("Регламент чемпіонату оновлено.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-6">Чемпіонати</h1>
      {hasDraftChanges ? (
        <p className="text-xs text-amber-300 mb-4">Є незбережені зміни (чернетка зберігається автоматично).</p>
      ) : null}

      {restorePreview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">Підтвердження відновлення</p>
            <h2 className="text-xl font-bold text-white mb-2">{restorePreview.name}</h2>
            <p className="text-zinc-300 text-sm mb-4">
              Після відновлення цей чемпіонат також стане активним.
            </p>
            <div className="rounded-lg border border-zinc-800 p-3 text-sm text-zinc-300 space-y-1">
              <p>Учасників: {restorePreview.participantsCount}</p>
              <p>Етапів: {restorePreview.stagesCount}</p>
              <p>Топ-3: {restorePreview.leaders.length > 0 ? restorePreview.leaders.join(", ") : "немає"}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setRestorePreview(null)}>
                Скасувати
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void restoreArchivedChampionship(restorePreview.id);
                  setRestorePreview(null);
                }}
                disabled={isSubmitting}
              >
                Підтвердити відновлення
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader className="mb-6" />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-zinc-800">
            {(
              [
                { key: "active", label: `Активні (${active.length})` },
                { key: "new", label: "Новий" },
                { key: "archive", label: `Архів (${archived.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${activeTab === tab.key
                  ? "text-[#ccff00] border-[#ccff00]"
                  : "text-zinc-400 border-transparent hover:text-white"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Active tab ── */}
          {activeTab === "active" && (
            <div className="space-y-4">
              {active.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                  <p className="text-zinc-400 mb-3">Активних чемпіонатів немає.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="text-sm text-[#ccff00] hover:opacity-80 transition-opacity"
                  >
                    Створити чемпіонат →
                  </button>
                </div>
              ) : (
                active.map((item) => {
                  const regulations = activeRegulations[item._id] ?? emptyRegulations();
                  const isExpanded = expandedRegChampId === item._id;
                  const isPrizesExpanded = expandedPrizesChampId === item._id;
                  return (
                    <div key={item._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{item.name}</span>
                            <span className="text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5 shrink-0">
                              {item.championshipType === "teams" ? "Endurance" : "Sprint"}
                            </span>
                          </div>
                          <p className="text-zinc-500 text-xs mt-1">
                            Старт: {new Date(item.startedAt).toLocaleDateString("uk-UA")}
                          </p>
                        </div>
                        <Link href={`/admin/championships/${item._id}`}>
                          <Button type="button" variant="secondary" size="sm">Деталі</Button>
                        </Link>
                      </div>

                      {/* Settings row */}
                      <div className="flex flex-wrap items-center gap-4 py-3 px-3 bg-zinc-950 rounded-lg">
                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={activeFastestLap[item._id] ?? false}
                            onChange={(e) =>
                              setActiveFastestLap((prev) => ({ ...prev, [item._id]: e.target.checked }))
                            }
                            className="accent-[#ccff00]"
                          />
                          Best lap бонус (+1 очко)
                        </label>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void saveChampionshipSettings(item._id)}
                          disabled={Boolean(submittingId)}
                        >
                          {submittingId === item._id ? "Збереження..." : "Зберегти"}
                        </Button>
                      </div>

                      {/* Expandable buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setExpandedRegChampId((prev) => (prev === item._id ? null : item._id))
                          }
                        >
                          {isExpanded ? "Сховати регламент" : "Регламент"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setExpandedPrizesChampId((prev) => (prev === item._id ? null : item._id))
                          }
                        >
                          {isPrizesExpanded ? "Сховати призи" : "Редагувати призи"}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 border border-zinc-800 rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">Регламент</h3>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addRegulationSection(item._id)}
                            >
                              Додати пункт
                            </Button>
                          </div>

                          <input
                            type="text"
                            value={regulations.title}
                            onChange={(e) =>
                              setActiveRegulations((prev) => ({
                                ...prev,
                                [item._id]: { ...regulations, title: e.target.value },
                              }))
                            }
                            placeholder="Заголовок"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                          />

                          <textarea
                            value={regulations.intro}
                            onChange={(e) =>
                              setActiveRegulations((prev) => ({
                                ...prev,
                                [item._id]: { ...regulations, intro: e.target.value },
                              }))
                            }
                            placeholder="Вступ"
                            className="w-full min-h-20 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                          />

                          <div className="space-y-2">
                            {regulations.sections.map((section, index) => (
                              <div key={`reg-${item._id}-${index}`} className="border border-zinc-800 rounded-lg p-3 space-y-2">
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={(e) => updateRegulationSection(item._id, index, "title", e.target.value)}
                                  placeholder={`Заголовок пункту ${index + 1}`}
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                                />
                                <textarea
                                  value={section.content}
                                  onChange={(e) => updateRegulationSection(item._id, index, "content", e.target.value)}
                                  placeholder="Текст пункту"
                                  className="w-full min-h-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                                />
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => removeRegulationSection(item._id, index)}
                                  >
                                    Видалити пункт
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void saveChampionshipRegulations(item._id)}
                            disabled={Boolean(submittingId)}
                          >
                            {submittingId === item._id ? "Збереження..." : "Зберегти регламент"}
                          </Button>
                        </div>
                      )}

                      {isPrizesExpanded && (
                        <div className="border border-zinc-800 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">Призовий фонд</h3>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setActivePrizes((prev) => ({
                                  ...prev,
                                  [item._id]: [...(prev[item._id] ?? []), { place: "", description: "" }],
                                }))
                              }
                            >
                              + Приз
                            </Button>
                          </div>
                          {(activePrizes[item._id] ?? []).map((prize, index) => (
                            <div key={`prize-${item._id}-${index}`} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Місце"
                                value={prize.place}
                                onChange={(e) => updateActivePrize(item._id, index, "place", e.target.value)}
                                className="w-28 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Опис призу"
                                value={prize.description}
                                onChange={(e) => updateActivePrize(item._id, index, "description", e.target.value)}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                              />
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => removePrize(item._id, index)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void savePrizes(item._id)}
                            disabled={Boolean(submittingId)}
                          >
                            {submittingId === item._id ? "Збереження..." : "Зберегти призи"}
                          </Button>
                        </div>
                      )}

                      {/* Finish section */}
                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-800">
                        <label className="flex items-center gap-2 text-sm text-zinc-400">
                          <input
                            type="checkbox"
                            checked={notifyFinishInTelegram}
                            onChange={(e) => setNotifyFinishInTelegram(e.target.checked)}
                            className="accent-[#ccff00]"
                          />
                          Telegram-новина про завершення
                        </label>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => void finishChampionship(item._id)}
                          disabled={Boolean(submittingId)}
                        >
                          {submittingId === item._id ? "Завершення..." : "Завершити чемпіонат"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Preseason news */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h2 className="font-bold text-white text-sm">Новини до старту</h2>
                <p className="text-zinc-500 text-xs">Окремо для Sprint і Endurance, якщо немає активного чемпіонату</p>

                <div className="space-y-2">
                  <label className="block text-zinc-400 text-xs">Sprint</label>
                  <textarea
                    value={preseasonNewsByType.solo}
                    onChange={(e) =>
                      setPreseasonNewsByType((prev) => ({ ...prev, solo: e.target.value }))
                    }
                    placeholder="Новина для Sprint..."
                    className="w-full min-h-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-400 text-xs">Endurance</label>
                  <textarea
                    value={preseasonNewsByType.teams}
                    onChange={(e) =>
                      setPreseasonNewsByType((prev) => ({ ...prev, teams: e.target.value }))
                    }
                    placeholder="Новина для Endurance..."
                    className="w-full min-h-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                  />
                </div>

                <Button type="button" variant="secondary" onClick={savePreseasonNews} disabled={isSubmitting}>
                  Зберегти
                </Button>
              </div>
            </div>
          )}

          {/* ── New championship tab ── */}
          {activeTab === "new" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Новий чемпіонат</h2>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Назва чемпіонату"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              />
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Формат</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "solo" | "teams")}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                >
                  <option value="solo">Sprint</option>
                  <option value="teams">Endurance</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-zinc-400 text-sm">Призовий фонд *</label>
                  <button
                    type="button"
                    onClick={() => setNewPrizes((prev) => [...prev, { place: "", description: "" }])}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    + Додати
                  </button>
                </div>
                <div className="space-y-2">
                  {newPrizes.map((prize, index) => (
                    <div key={`new-prize-${index}`} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Місце"
                        value={prize.place}
                        onChange={(e) =>
                          setNewPrizes((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, place: e.target.value } : p)),
                          )
                        }
                        className="w-28 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Опис призу"
                        value={prize.description}
                        onChange={(e) =>
                          setNewPrizes((prev) =>
                            prev.map((p, i) => (i === index ? { ...p, description: e.target.value } : p)),
                          )
                        }
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                      />
                      {newPrizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewPrizes((prev) => prev.filter((_, i) => i !== index))}
                          className="px-2 py-2 rounded-md border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={newFastestLapBonusEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNewFastestLapBonusEnabled(checked);
                    setNewRegulations(defaultRegulationsForNewChampionship(checked));
                  }}
                  className="accent-[#ccff00]"
                />
                Best lap бонус (+1 очко)
              </label>

              <div className="border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-bold text-white">Дефолтний регламент для нового чемпіонату</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setNewRegulations(defaultRegulationsForNewChampionship(newFastestLapBonusEnabled))}
                  >
                    Скинути до дефолту
                  </Button>
                </div>

                <input
                  type="text"
                  value={newRegulations.title}
                  onChange={(e) =>
                    setNewRegulations((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Заголовок"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                />

                <textarea
                  value={newRegulations.intro}
                  onChange={(e) =>
                    setNewRegulations((prev) => ({
                      ...prev,
                      intro: e.target.value,
                    }))
                  }
                  placeholder="Вступ"
                  className="w-full min-h-20 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                />

                <div className="space-y-2">
                  {newRegulations.sections.map((section, index) => (
                    <div key={`new-reg-${index}`} className="border border-zinc-800 rounded-lg p-3 space-y-2">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateNewRegulationSection(index, "title", e.target.value)}
                        placeholder={`Заголовок пункту ${index + 1}`}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                      />
                      <textarea
                        value={section.content}
                        onChange={(e) => updateNewRegulationSection(index, "content", e.target.value)}
                        placeholder="Текст пункту"
                        className="w-full min-h-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => removeNewRegulationSection(index)}
                        >
                          Видалити пункт
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="secondary" size="sm" onClick={addNewRegulationSection}>
                  Додати пункт
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={notifyStartInTelegram}
                  onChange={(e) => setNotifyStartInTelegram(e.target.checked)}
                  className="accent-[#ccff00]"
                />
                Telegram-новина про старт
              </label>
              <Button type="button" onClick={startNewChampionship} disabled={isSubmitting}>
                {isSubmitting ? "Створення..." : "Стартувати чемпіонат"}
              </Button>
              <p className="text-zinc-600 text-xs">
                Можна запускати кілька активних чемпіонатів одночасно.
              </p>
            </div>
          )}

          {/* ── Archive tab ── */}
          {activeTab === "archive" && (
            <div className="space-y-2">
              {archived.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                  <p className="text-zinc-500">Архів порожній.</p>
                </div>
              ) : (
                archived.map((item) => (
                  <div key={item._id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="ml-2 text-xs text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                        {item.championshipType === "teams" ? "Endurance" : "Sprint"}
                      </span>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {item.startedAt ? new Date(item.startedAt).toLocaleDateString("uk-UA") : "—"}
                        {" → "}
                        {item.endedAt ? new Date(item.endedAt).toLocaleDateString("uk-UA") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void openRestorePreview(item._id)}
                        disabled={isSubmitting}
                      >
                        {previewLoading ? "Завантаження..." : "Відновити"}
                      </Button>
                      <Link href={`/admin/championships/${item._id}`}>
                        <Button type="button" variant="secondary" size="sm">Деталі</Button>
                      </Link>
                      {confirmDeleteId === item._id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-400">Впевнені?</span>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => void deleteChampionship(item._id)}
                            disabled={isSubmitting}
                          >
                            Так
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Ні
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDeleteId(item._id)}
                          disabled={isSubmitting}
                        >
                          Видалити
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 mt-4 text-sm">{success}</p>}
        </>
      )}
    </main>
  );
}
