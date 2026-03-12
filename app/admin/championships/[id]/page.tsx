"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Loader } from "@/app/components/ui/Loader";
import { Championship, ChampionshipStanding, Pilot, Stage } from "@/types";
import { POINTS_TABLE } from "@/lib/utils/championship";
import { formatPilotFullName } from "@/lib/utils/pilotName";

const positionMedals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface ChampionshipDetailsResponse {
  championship: Championship;
  pilots: Pilot[];
  stages: Stage[];
  standings: ChampionshipStanding[];
}

export default function AdminChampionshipDetailsPage() {
  const { id } = useParams<{ id: string; }>();
  const router = useRouter();

  const [data, setData] = useState<ChampionshipDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState("");
  const [actionModal, setActionModal] = useState<"delete" | "restore" | null>(null);
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/championships/${id}`);
        if (!res.ok) throw new Error("Не вдалося завантажити дані");
        const json = (await res.json()) as ChampionshipDetailsResponse;
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/championships/${id}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Помилка видалення");
      router.push("/admin/championships");
    } catch (err) {
      setError((err as Error).message);
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    setError("");
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/championships/${id}/restore`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося відновити чемпіонат");
      router.push("/admin/championships");
    } catch (err) {
      setError((err as Error).message);
      setIsRestoring(false);
    }
  };

  if (isLoading) return (
    <main className="max-w-4xl mx-auto px-4 py-8"><Loader /></main>
  );

  if (error || !data) return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-red-400">{error || "Не знайдено"}</p>
      <Link href="/admin/championships" className="text-zinc-500 hover:text-white text-sm mt-4 block">← Назад</Link>
    </main>
  );

  const { championship, pilots, stages, standings } = data;
  const completedStages = stages.filter((s) => s.isCompleted);
  const participantLabel = championship.championshipType === "teams" ? "Команда" : "Пілот";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">Підтвердження дії</p>
            <h2 className="text-xl font-bold text-white mb-2">{championship.name}</h2>
            <p className="text-zinc-300 text-sm mb-4">
              {actionModal === "delete"
                ? "Чемпіонат буде остаточно видалений з архіву разом з етапами, учасниками і результатами."
                : "Чемпіонат буде відновлено в активний статус з усією історією результатів."}
            </p>
            <div className="rounded-lg border border-zinc-800 p-3 text-sm text-zinc-300 space-y-1 mb-4">
              <p>Учасників: {pilots.length}</p>
              <p>Етапів: {stages.length}</p>
              <p>
                Топ-3: {standings.slice(0, 3).map((row) => formatPilotFullName(row.pilot.name, row.pilot.surname)).join(", ") || "немає"}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActionModal(null)}>
                Скасувати
              </Button>
              {actionModal === "restore" ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setActionModal(null);
                    void handleRestore();
                  }}
                  disabled={isRestoring}
                >
                  {isRestoring ? "Відновлення..." : "Підтвердити відновлення"}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setActionModal(null);
                    void handleDelete();
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Видалення..." : "Підтвердити видалення"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Link href="/admin/championships" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Чемпіонати
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-white">{championship.name}</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Формат: {championship.championshipType === "teams" ? "Команди" : "Соло (пілоти)"}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            {championship.startedAt ? new Date(championship.startedAt).toLocaleDateString("uk-UA") : "—"}
            {" → "}
            {championship.endedAt ? new Date(championship.endedAt).toLocaleDateString("uk-UA") : "—"}
            {" · "}
            <span className="text-zinc-600">
              {pilots.length} {championship.championshipType === "teams" ? "команд" : "пілотів"} · {stages.length} етапів
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {championship.status === "archived" && (
            <Button type="button" size="sm" onClick={() => setActionModal("restore")} disabled={isRestoring}>
              {isRestoring ? "Відновлення..." : "Відновити в активний"}
            </Button>
          )}
          <Button type="button" variant="danger" size="sm" onClick={() => setActionModal("delete")}>
            Видалити з архіву
          </Button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Загальний залік */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Загальний залік</h2>
        {standings.length === 0 ? (
          <p className="text-zinc-500">Немає даних.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-zinc-800 text-zinc-400 text-left">
                  <th className="px-3 py-2 font-semibold w-10">#</th>
                  <th className="px-3 py-2 font-semibold">{participantLabel}</th>
                  {completedStages.map((stage) => (
                    <th key={stage._id} className="px-2 py-2 font-semibold text-center whitespace-nowrap">
                      Ет.{stage.number}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold text-center">Очки</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, idx) => (
                  <tr key={row.pilot._id} className={`border-t border-zinc-800 ${idx === 0 ? "bg-yellow-500/5" : ""}`}>
                    <td className="px-3 py-2 font-bold text-zinc-300">
                      {positionMedals[row.position] ?? row.position}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs font-mono w-5">#{row.pilot.number}</span>
                        <span className="font-semibold text-white">
                          {formatPilotFullName(row.pilot.name, row.pilot.surname)}
                        </span>
                      </div>
                    </td>
                    {completedStages.map((stage) => {
                      const ss = row.standings.find((s) => String(s.stageId) === String(stage._id));
                      const hasPenalty = Boolean(ss && ss.penaltyPoints > 0);
                      return (
                        <td key={stage._id} className="px-2 py-2 text-center">
                          {ss ? (
                            <Badge
                              variant={ss.isDropped ? "dropped" : ss.dnf || ss.dns ? "warning" : hasPenalty ? "danger" : "default"}
                              className={hasPenalty ? "cursor-help" : ""}
                              title={hasPenalty ? `Штраф: -${ss.penaltyPoints}. Причина: ${ss.penaltyReason}` : undefined}
                            >
                              {ss.dnf ? "DNF" : ss.dns ? "DNS" : ss.points}
                            </Badge>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-bold text-white">{row.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-zinc-500 flex gap-4 flex-wrap pt-3 border-t border-zinc-800">
              <span><Badge variant="dropped">0</Badge> — закреслений (не враховується)</span>
              <span><Badge variant="warning">DNF</Badge> — не фінішував</span>
              <span>Система очок: {Object.entries(POINTS_TABLE).map(([pos, pts]) => `${pos}→${pts}`).join(", ")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Етапи з результатами */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Етапи ({stages.length})</h2>
        {stages.length === 0 ? (
          <p className="text-zinc-500">Немає етапів.</p>
        ) : (
          <div className="space-y-2">
            {stages.map((stage) => {
              const isExpanded = expandedStageId === stage._id;
              const sortedResults = [...(stage.results ?? [])].sort((a, b) => {
                if (a.dnf || a.dns) return 1;
                if (b.dnf || b.dns) return -1;
                return a.position - b.position;
              });
              return (
                <div key={stage._id} className="border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedStageId(isExpanded ? null : stage._id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                  >
                    <div>
                      <span className="font-semibold text-white">
                        Ет.{stage.number} — {stage.name}
                      </span>
                      <span className="ml-3 text-zinc-500 text-sm">
                        {stage.date ? new Date(stage.date).toLocaleDateString("uk-UA") : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.isCompleted ? (
                        <span className="text-xs text-emerald-400 border border-emerald-800 rounded px-2 py-0.5">Завершено</span>
                      ) : (
                        <span className="text-xs text-zinc-500 border border-zinc-700 rounded px-2 py-0.5">Не завершено</span>
                      )}
                      <span className="text-zinc-500 text-sm">{sortedResults.length} пілотів</span>
                      <span className="text-zinc-600 text-xs ml-1">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-zinc-800">
                      {sortedResults.length === 0 ? (
                        <p className="text-zinc-500 text-sm px-4 py-3">Немає результатів.</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-zinc-800/50 text-zinc-400 text-left">
                              <th className="px-4 py-2 font-semibold w-10">Поз.</th>
                              <th className="px-4 py-2 font-semibold">{participantLabel}</th>
                              <th className="px-4 py-2 font-semibold text-center">Очки</th>
                              <th className="px-4 py-2 font-semibold text-center">Штраф</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedResults.map((result) => {
                              const populatedPilot =
                                result.pilotId && typeof result.pilotId === "object"
                                  ? (result.pilotId as unknown as Pilot)
                                  : undefined;
                              const pilot = (result.pilot as Pilot | undefined) ?? populatedPilot;
                              const pilotKey =
                                pilot?._id ??
                                (typeof result.pilotId === "string"
                                  ? result.pilotId
                                  : (result.pilotId as { _id?: string; } | undefined)?._id) ??
                                `${result.position}-${result.points}`;
                              const hasPenalty = Boolean(result.penaltyPoints && result.penaltyPoints > 0);
                              return (
                                <tr key={pilotKey} className="border-t border-zinc-800/50">
                                  <td className="px-4 py-2 font-bold text-zinc-300">
                                    {result.dnf ? "DNF" : result.dns ? "DNS" : result.position}
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      {pilot && (
                                        <span className="text-zinc-500 text-xs font-mono">#{pilot.number}</span>
                                      )}
                                      <span className="text-white">
                                        {pilot
                                          ? formatPilotFullName(pilot.name, pilot.surname)
                                          : typeof result.pilotId === "string"
                                            ? result.pilotId
                                            : "Невідомий пілот"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <Badge variant={result.dnf || result.dns ? "warning" : hasPenalty ? "danger" : "default"}>
                                      {result.dnf ? "DNF" : result.dns ? "DNS" : result.points}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 text-center text-sm">
                                    {hasPenalty ? (
                                      <span className="text-red-400" title={result.penaltyReason}>
                                        -{result.penaltyPoints}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Список пілотів */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          {championship.championshipType === "teams" ? "Команди" : "Пілоти"} ({pilots.length})
        </h2>
        {pilots.length === 0 ? (
          <p className="text-zinc-500">
            {championship.championshipType === "teams" ? "Немає команд." : "Немає пілотів."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pilots.map((pilot) => (
              <div key={pilot._id} className="border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3">
                <span className="text-zinc-500 text-sm font-mono w-8">#{pilot.number}</span>
                <span className="text-white font-medium">
                  {formatPilotFullName(pilot.name, pilot.surname)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
