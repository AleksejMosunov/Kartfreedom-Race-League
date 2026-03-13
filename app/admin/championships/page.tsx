"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Championship, RegulationSection, RegulationsContent } from "@/types";

interface ChampionshipsResponse {
  active?: Championship[];
  current?: Championship | null;
  archived: Championship[];
  preseasonNews?: string;
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
  const [activeFastestLap, setActiveFastestLap] = useState<Record<string, boolean>>({});
  const [activeRegulations, setActiveRegulations] = useState<Record<string, RegulationsContent>>({});
  const [expandedRegChampId, setExpandedRegChampId] = useState<string | null>(null);
  const [preseasonNews, setPreseasonNews] = useState("");
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/championships");
      if (!res.ok) throw new Error("Не вдалося завантажити чемпіонати");
      const payload = (await res.json()) as ChampionshipsResponse;
      const activeList: Championship[] = payload.active ?? (payload.current ? [payload.current] : []);
      setActive(activeList);
      setArchived(payload.archived ?? []);
      setPreseasonNews(payload.preseasonNews ?? "");

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
      if (activeList.length > 0 && !expandedRegChampId) {
        setExpandedRegChampId(activeList[0]._id);
      }
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

  const startNewChampionship = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          championshipType: newType,
          fastestLapBonusEnabled: newFastestLapBonusEnabled,
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
        body: JSON.stringify({ preseasonNews }),
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
      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Адмін-панель
      </Link>

      <h1 className="text-3xl font-black text-white mb-8">Чемпіонати</h1>

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
        <p className="text-zinc-400">Завантаження...</p>
      ) : (
        <>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Активні чемпіонати ({active.length})</h2>
            {active.length === 0 ? (
              <p className="text-zinc-400">Активних чемпіонатів немає.</p>
            ) : (
              <div className="space-y-4">
                {active.map((item) => {
                  const regulations = activeRegulations[item._id] ?? emptyRegulations();
                  const isExpanded = expandedRegChampId === item._id;
                  return (
                    <div key={item._id} className="border border-zinc-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-zinc-200 font-semibold">{item.name}</p>
                          <p className="text-zinc-400 text-sm">
                            Формат: {item.championshipType === "teams" ? "Endurance" : "Sprint"}
                          </p>
                          <p className="text-zinc-500 text-sm">
                            Старт: {new Date(item.startedAt).toLocaleDateString("uk-UA")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/championships/${item._id}`}>
                            <Button type="button" variant="secondary" size="sm">Деталі</Button>
                          </Link>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => void finishChampionship(item._id)}
                            disabled={Boolean(submittingId)}
                          >
                            {submittingId === item._id ? "Завершення..." : "Завершити"}
                          </Button>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          checked={activeFastestLap[item._id] ?? false}
                          onChange={(e) =>
                            setActiveFastestLap((prev) => ({ ...prev, [item._id]: e.target.checked }))
                          }
                          className="accent-red-500"
                        />
                        Best lap бонус (+1 очко)
                      </label>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void saveChampionshipSettings(item._id)}
                          disabled={Boolean(submittingId)}
                        >
                          {submittingId === item._id ? "Збереження..." : "Зберегти налаштування"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setExpandedRegChampId((prev) => (prev === item._id ? null : item._id))
                          }
                        >
                          {isExpanded ? "Сховати регламент" : "Редагувати регламент"}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Старт нового чемпіонату</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Назва чемпіонату"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
            />
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Формат чемпіонату</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "solo" | "teams")}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="solo">Sprint</option>
                <option value="teams">Endurance</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={newFastestLapBonusEnabled}
                onChange={(e) => setNewFastestLapBonusEnabled(e.target.checked)}
                className="accent-red-500"
              />
              Увімкнути Best lap бонус (+1 очко)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={notifyStartInTelegram}
                onChange={(e) => setNotifyStartInTelegram(e.target.checked)}
                className="accent-red-500"
              />
              Надіслати новину в Telegram про старт
            </label>
            <Button type="button" onClick={startNewChampionship} disabled={isSubmitting}>
              {isSubmitting ? "Створення..." : "Стартувати новий чемпіонат"}
            </Button>
            <p className="text-zinc-500 text-sm">
              Можна запускати декілька активних чемпіонатів одночасно.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Новини про майбутній старт</h2>
            <textarea
              value={preseasonNews}
              onChange={(e) => setPreseasonNews(e.target.value)}
              placeholder="Тут можна написати новину для користувачів, якщо активного чемпіонату немає"
              className="w-full min-h-28 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
            />
            <Button type="button" variant="secondary" onClick={savePreseasonNews} disabled={isSubmitting}>
              Зберегти новину
            </Button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Архів завершених</h2>
            {archived.length === 0 ? (
              <p className="text-zinc-500">Архів порожній.</p>
            ) : (
              <div className="space-y-2">
                {archived.map((item) => (
                  <div key={item._id} className="border border-zinc-800 rounded-lg px-4 py-3 flex justify-between items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="ml-3 text-zinc-500 text-sm">
                        {item.startedAt ? new Date(item.startedAt).toLocaleDateString("uk-UA") : "—"}
                        {" → "}
                        {item.endedAt ? new Date(item.endedAt).toLocaleDateString("uk-UA") : "—"}
                      </span>
                      <span className="ml-3 text-zinc-600 text-xs">
                        {item.championshipType === "teams" ? "Endurance" : "Sprint"}
                      </span>
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
                        <Button type="button" variant="secondary" size="sm">
                          Деталі
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 mt-4 text-sm">{success}</p>}
        </>
      )}
    </main>
  );
}
