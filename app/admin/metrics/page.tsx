"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/app/components/ui/Loader";

type AuditActionCount = { _id: string; count: number; };
type RecentEntry = {
  _id: string;
  action: string;
  entityType: string;
  entityLabel: string;
  adminUsername: string;
  createdAt: string;
};

type MetricsData = {
  championships: { active: number; archived: number; };
  participants: { pilots: number; teams: number; };
  stages: { total: number; completed: number; };
  adminUsers: { total: number; active: number; };
  auditActivity: {
    last7d: number;
    last30d: number;
    byAction: AuditActionCount[];
    byEntity: AuditActionCount[];
  };
  recentAudit: RecentEntry[];
  generatedAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  create: "Створено",
  update: "Оновлено",
  delete: "Видалено",
  finish: "Завершено",
  restore: "Відновлено",
  import: "Імпорт",
  role_change: "Зміна ролі",
  deactivate: "Деактивовано",
  activate: "Активовано",
  create_user: "Новий користувач",
};

const ENTITY_LABELS: Record<string, string> = {
  championship: "Чемпіонат",
  stage: "Етап",
  pilot: "Пілот",
  team: "Команда",
  admin_user: "Адмін",
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string; }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminMetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as MetricsData & { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося завантажити метрики");
      setData(body);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <main className="max-w-5xl mx-auto px-4 py-16 flex justify-center"><Loader /></main>;
  if (error) return <main className="max-w-5xl mx-auto px-4 py-8"><p className="text-red-400">{error}</p></main>;
  if (!data) return null;

  const stagesPct = data.stages.total > 0
    ? Math.round((data.stages.completed / data.stages.total) * 100)
    : 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Метрики</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Оновлено: {new Date(data.generatedAt).toLocaleString("uk-UA")}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          ↻ Оновити
        </button>
      </div>

      {/* System stats */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Система</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Чемпіонати"
            value={data.championships.active + data.championships.archived}
            sub={`${data.championships.active} активних · ${data.championships.archived} архівних`}
          />
          <StatCard
            label="Пілоти / Команди"
            value={data.participants.pilots + data.participants.teams}
            sub={`${data.participants.pilots} пілотів · ${data.participants.teams} команд`}
          />
          <StatCard
            label="Етапи"
            value={data.stages.total}
            sub={`${data.stages.completed} завершених (${stagesPct}%)`}
          />
          <StatCard
            label="Адміни"
            value={data.adminUsers.active}
            sub={`${data.adminUsers.active} з ${data.adminUsers.total} активних`}
          />
        </div>
      </section>

      {/* Audit activity */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Активність аудит-лога</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="За 7 днів" value={data.auditActivity.last7d} sub="дій" />
          <StatCard label="За 30 днів" value={data.auditActivity.last30d} sub="дій" />
        </div>
      </section>

      {/* Breakdown tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By action */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">По діях</h3>
          {data.auditActivity.byAction.length === 0 ? (
            <p className="text-zinc-500 text-sm">Немає даних.</p>
          ) : (
            <div className="space-y-2">
              {data.auditActivity.byAction.map((row) => (
                <div key={row._id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-zinc-300">{ACTION_LABELS[row._id] ?? row._id}</span>
                      <span className="text-zinc-500">{row.count}</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{
                          width: `${Math.round((row.count / (data.auditActivity.byAction[0]?.count ?? 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By entity type */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-3">По об&apos;єктах</h3>
          {data.auditActivity.byEntity.length === 0 ? (
            <p className="text-zinc-500 text-sm">Немає даних.</p>
          ) : (
            <div className="space-y-2">
              {data.auditActivity.byEntity.map((row) => (
                <div key={row._id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-zinc-300">{ENTITY_LABELS[row._id] ?? row._id}</span>
                      <span className="text-zinc-500">{row.count}</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full"
                        style={{
                          width: `${Math.round((row.count / (data.auditActivity.byEntity[0]?.count ?? 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent audit entries */}
      {data.recentAudit.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Остання активність</h2>
            <a href="/admin/audit" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Весь лог →
            </a>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
            {data.recentAudit.map((entry) => (
              <div key={entry._id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="text-xs text-zinc-500 shrink-0">
                  {ENTITY_LABELS[entry.entityType] ?? entry.entityType}
                </span>
                <span className="text-white text-sm flex-1 min-w-0 truncate">
                  {entry.entityLabel || entry._id}
                </span>
                <span className="text-zinc-500 text-xs shrink-0">
                  {ACTION_LABELS[entry.action] ?? entry.action}
                </span>
                <span className="text-zinc-600 text-xs shrink-0">
                  {entry.adminUsername}
                </span>
                <span className="text-zinc-600 text-xs shrink-0">
                  {new Date(entry.createdAt).toLocaleString("uk-UA", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
