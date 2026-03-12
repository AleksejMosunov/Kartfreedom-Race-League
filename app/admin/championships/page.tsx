"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Championship, RegulationSection, RegulationsContent } from "@/types";

interface ChampionshipsResponse {
  current: Championship | null;
  archived: Championship[];
  preseasonNews?: string;
}

const emptySection: RegulationSection = { title: "", content: "" };

export default function AdminChampionshipsPage() {
  const [current, setCurrent] = useState<Championship | null>(null);
  const [archived, setArchived] = useState<Championship[]>([]);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"solo" | "teams">("solo");
  const [newFastestLapBonusEnabled, setNewFastestLapBonusEnabled] = useState(false);
  const [currentFastestLapBonusEnabled, setCurrentFastestLapBonusEnabled] = useState(false);
  const [preseasonNews, setPreseasonNews] = useState("");
  const [regulations, setRegulations] = useState<RegulationsContent>({
    title: "",
    intro: "",
    sections: [emptySection],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setCurrent(payload.current);
      setCurrentFastestLapBonusEnabled(Boolean(payload.current?.fastestLapBonusEnabled));
      setArchived(payload.archived ?? []);
      setPreseasonNews(payload.preseasonNews ?? "");
      if (payload.current?.regulations) {
        setRegulations({
          title: payload.current.regulations.title,
          intro: payload.current.regulations.intro,
          sections:
            payload.current.regulations.sections.length > 0
              ? payload.current.regulations.sections
              : [emptySection],
        });
      } else {
        setRegulations({ title: "", intro: "", sections: [emptySection] });
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

  const saveCurrentChampionshipSettings = async () => {
    if (!current) return;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/championships/${current._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fastestLapBonusEnabled: currentFastestLapBonusEnabled,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося зберегти налаштування чемпіонату");
      setSuccess("Налаштування чемпіонату оновлено.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishCurrentChampionship = async () => {
    if (!current) return;
    const finishedChampionshipId = current._id;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/championships/${current._id}/finish`, {
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
            body: JSON.stringify({ championshipId: finishedChampionshipId }),
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
      setIsSubmitting(false);
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
    index: number,
    field: keyof RegulationSection,
    value: string,
  ) => {
    setRegulations((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const addRegulationSection = () => {
    setRegulations((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...emptySection }],
    }));
  };

  const removeRegulationSection = (index: number) => {
    setRegulations((prev) => ({
      ...prev,
      sections:
        prev.sections.length === 1
          ? [{ ...emptySection }]
          : prev.sections.filter((_, i) => i !== index),
    }));
  };

  const saveCurrentRegulations = async () => {
    if (!current) return;

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
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/championships/current/regulations", {
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

      setSuccess("Регламент поточного чемпіонату оновлено.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
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
              Після відновлення цей чемпіонат стане активним, а поточний активний (якщо є) повинен бути завершений.
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
                disabled={Boolean(current) || isSubmitting}
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
            <h2 className="text-lg font-bold text-white">Поточний чемпіонат</h2>
            {current ? (
              <>
                <p className="text-zinc-200 font-semibold">{current.name}</p>
                <p className="text-zinc-400 text-sm">
                  Формат: {current.championshipType === "teams" ? "Endurance" : "Sprint"}
                </p>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={currentFastestLapBonusEnabled}
                    onChange={(e) => setCurrentFastestLapBonusEnabled(e.target.checked)}
                    className="accent-red-500"
                  />
                  Best lap бонус (+1 очко)
                </label>
                <p className="text-zinc-500 text-sm">
                  Старт: {new Date(current.startedAt).toLocaleDateString("uk-UA")}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveCurrentChampionshipSettings}
                  disabled={isSubmitting}
                >
                  Зберегти налаштування
                </Button>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={notifyFinishInTelegram}
                    onChange={(e) => setNotifyFinishInTelegram(e.target.checked)}
                    className="accent-red-500"
                  />
                  Надіслати новину в Telegram при завершенні
                </label>
                <Button type="button" variant="danger" onClick={finishCurrentChampionship} disabled={isSubmitting}>
                  {isSubmitting ? "Завершення..." : "Завершити чемпіонат"}
                </Button>
              </>
            ) : (
              <p className="text-zinc-400">Активного чемпіонату немає.</p>
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
            <Button type="button" onClick={startNewChampionship} disabled={Boolean(current) || isSubmitting}>
              {isSubmitting ? "Створення..." : "Стартувати новий чемпіонат"}
            </Button>
            {current && (
              <p className="text-zinc-500 text-sm">
                Спочатку завершіть поточний чемпіонат, щоб почати новий.
              </p>
            )}
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

          {current && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Регламент поточного чемпіонату</h2>
                <Button type="button" variant="secondary" size="sm" onClick={addRegulationSection}>
                  Додати пункт
                </Button>
              </div>

              <input
                type="text"
                value={regulations.title}
                onChange={(e) => setRegulations((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Заголовок"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              />

              <textarea
                value={regulations.intro}
                onChange={(e) => setRegulations((prev) => ({ ...prev, intro: e.target.value }))}
                placeholder="Вступ"
                className="w-full min-h-20 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              />

              <div className="space-y-3">
                {regulations.sections.map((section, index) => (
                  <div key={`reg-${index}`} className="border border-zinc-800 rounded-lg p-3 space-y-2">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateRegulationSection(index, "title", e.target.value)}
                      placeholder={`Заголовок пункту ${index + 1}`}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                    />
                    <textarea
                      value={section.content}
                      onChange={(e) => updateRegulationSection(index, "content", e.target.value)}
                      placeholder="Текст пункту"
                      className="w-full min-h-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                    />
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="danger" onClick={() => removeRegulationSection(index)}>
                        Видалити пункт
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" onClick={saveCurrentRegulations} disabled={isSubmitting}>
                Зберегти регламент
              </Button>
            </div>
          )}

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
                        disabled={Boolean(current) || isSubmitting}
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
