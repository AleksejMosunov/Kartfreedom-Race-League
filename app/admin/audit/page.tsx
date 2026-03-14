"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/app/components/ui/Loader";

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "finish"
  | "restore"
  | "import"
  | "role_change"
  | "deactivate"
  | "activate"
  | "create_user";

type AuditEntityType =
  | "championship"
  | "stage"
  | "pilot"
  | "team"
  | "admin_user";

type AuditLogEntry = {
  _id: string;
  adminUserId: string | null;
  adminUsername: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string;
  createdAt: string;
};

const ACTION_LABELS: Record<AuditAction, string> = {
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

const ACTION_COLORS: Record<AuditAction, string> = {
  create: "bg-emerald-900/50 text-emerald-300 border border-emerald-800",
  update: "bg-blue-900/50 text-blue-300 border border-blue-800",
  delete: "bg-red-900/50 text-red-300 border border-red-800",
  finish: "bg-yellow-900/50 text-yellow-300 border border-yellow-800",
  restore: "bg-purple-900/50 text-purple-300 border border-purple-800",
  import: "bg-teal-900/50 text-teal-300 border border-teal-800",
  role_change: "bg-orange-900/50 text-orange-300 border border-orange-800",
  deactivate: "bg-red-900/60 text-red-400 border border-red-700",
  activate: "bg-emerald-900/60 text-emerald-400 border border-emerald-700",
  create_user: "bg-sky-900/50 text-sky-300 border border-sky-800",
};

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  championship: "Чемпіонат",
  stage: "Етап",
  pilot: "Пілот",
  team: "Команда",
  admin_user: "Адмін",
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS) as AuditAction[];
const ALL_ENTITIES = Object.keys(ENTITY_LABELS) as AuditEntityType[];

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState<
    "all" | "today" | "week" | "month" | null
  >(null);

  const load = useCallback(
    async (p = page) => {
      setLoading(true);
      setError("");
      try {
        const sp = new URLSearchParams({ page: String(p), limit: String(limit) });
        if (filterAction) sp.set("action", filterAction);
        if (filterEntity) sp.set("entityType", filterEntity);
        if (filterUser) sp.set("adminUsername", filterUser);
        if (filterFrom) sp.set("from", filterFrom);
        if (filterTo) sp.set("to", filterTo);
        const res = await fetch(`/api/audit?${sp.toString()}`, { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as {
          logs?: AuditLogEntry[];
          total?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Не вдалося завантажити логи");
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [page, filterAction, filterEntity, filterUser, filterFrom, filterTo],
  );

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction, filterEntity, filterUser, filterFrom, filterTo]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const cleanupAudit = async (
    scope: "all" | "today" | "week" | "month",
  ) => {
    const labels = {
      all: "весь аудит-лог",
      today: "записи за сьогодні",
      week: "записи за тиждень",
      month: "записи за місяць",
    };

    const confirmed = window.confirm(
      `Очистити ${labels[scope]}? Цю дію неможливо скасувати.`,
    );
    if (!confirmed) return;

    setCleanupLoading(scope);
    setError("");

    try {
      const res = await fetch("/api/audit", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        deletedCount?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "Не вдалося очистити лог");
      setExpanded(null);
      await load(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCleanupLoading(null);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Аудит-лог</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Записи зберігаються 100 днів. Мутації даних: створення, зміна, видалення.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div>
          <h2 className="text-white font-semibold">Очистка логу</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Можна видалити весь аудит-лог або лише записи за окремий період.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "today", label: "Очистити за сьогодні" },
            { key: "week", label: "Очистити за тиждень" },
            { key: "month", label: "Очистити за місяць" },
            { key: "all", label: "Очистити весь лог" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                void cleanupAudit(
                  item.key as "all" | "today" | "week" | "month",
                )
              }
              disabled={cleanupLoading !== null}
              className={`px-3 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.key === "all"
                  ? "bg-red-950 border border-red-800 text-red-300 hover:bg-red-900"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                }`}
            >
              {cleanupLoading === item.key ? "Очищення..." : item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm col-span-1"
          >
            <option value="">Всі дії</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]}</option>
            ))}
          </select>

          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="">Всі об&apos;єкти</option>
            {ALL_ENTITIES.map((e) => (
              <option key={e} value={e}>{ENTITY_LABELS[e]}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Користувач"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm placeholder-zinc-500"
          />

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />

          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
        </div>
        {(filterAction || filterEntity || filterUser || filterFrom || filterTo) && (
          <button
            onClick={() => {
              setFilterAction("");
              setFilterEntity("");
              setFilterUser("");
              setFilterFrom("");
              setFilterTo("");
            }}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            × Скинути фільтри
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-zinc-500 text-sm py-8 text-center">Записів не знайдено.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const isOpen = expanded === log._id;
            const hasDiff = log.before !== null || log.after !== null;
            return (
              <div
                key={log._id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
              >
                <div
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${hasDiff ? "cursor-pointer hover:bg-zinc-800/50 transition-colors" : ""}`}
                  onClick={() => hasDiff && setExpanded(isOpen ? null : log._id)}
                >
                  {/* Action badge */}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ACTION_COLORS[log.action] ?? "bg-zinc-800 text-zinc-300 border border-zinc-700"}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>

                  {/* Entity */}
                  <span className="text-zinc-400 text-xs shrink-0">
                    {ENTITY_LABELS[log.entityType] ?? log.entityType}
                  </span>

                  {/* Label */}
                  <span className="text-white text-sm font-medium flex-1 min-w-0 truncate">
                    {log.entityLabel || log.entityId}
                  </span>

                  {/* User */}
                  <span className="text-zinc-500 text-xs shrink-0">
                    {log.adminUsername}
                  </span>

                  {/* IP */}
                  {log.ip ? (
                    <span className="text-zinc-600 text-xs shrink-0 hidden md:inline">
                      {log.ip}
                    </span>
                  ) : null}

                  {/* Time */}
                  <span className="text-zinc-500 text-xs shrink-0">
                    {formatDate(log.createdAt)}
                  </span>

                  {/* Expand icon */}
                  {hasDiff && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-zinc-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </div>

                {isOpen && hasDiff && (
                  <div className="border-t border-zinc-800 px-4 py-3 grid md:grid-cols-2 gap-4">
                    {log.before !== null && (
                      <div>
                        <p className="text-zinc-500 text-xs mb-1 font-semibold uppercase tracking-wide">До</p>
                        <pre className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after !== null && (
                      <div>
                        <p className="text-zinc-500 text-xs mb-1 font-semibold uppercase tracking-wide">Після</p>
                        <pre className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-sm">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} з {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => void load(page - 1)}
              className="px-3 py-1.5 rounded-md text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Попередня
            </button>
            <span className="px-3 py-1.5 text-sm text-zinc-400">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => void load(page + 1)}
              className="px-3 py-1.5 rounded-md text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Наступна →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
