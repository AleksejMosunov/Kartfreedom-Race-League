"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";

type AdminRole = "organizer" | "marshal" | "editor";

type AdminUserRow = {
  _id: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("editor");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Alert chat settings
  const [alertChatId, setAlertChatId] = useState("");
  const [alertChatLoading, setAlertChatLoading] = useState(true);
  const [alertChatSaving, setAlertChatSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-users", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as {
        users?: AdminUserRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося завантажити користувачів");
      setUsers(body.users ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { alertChatId?: string; };
        setAlertChatId(data.alertChatId ?? "");
      } catch {
        // ignore
      } finally {
        setAlertChatLoading(false);
      }
    })();
  }, []);

  const saveAlertChat = async () => {
    setAlertChatSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertChatId }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося зберегти");
      setSuccess("Chat ID збережено.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAlertChatSaving(false);
    }
  };

  const createUser = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, isActive: true }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося створити користувача");
      setUsername("");
      setPassword("");
      setRole("editor");
      setSuccess("Користувача створено.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateUser = async (id: string, payload: Record<string, unknown>) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin-users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; };
      if (!res.ok) throw new Error(body.error ?? "Не вдалося оновити користувача");
      setSuccess("Зміни збережено.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">Користувачі адмінки</h1>
      <p className="text-zinc-400 text-sm">Ролі: organizer (повний доступ), marshal (тільки результати етапів), editor (без прав поки що).</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h2 className="text-white font-semibold">Створити користувача</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="organizer">organizer</option>
            <option value="marshal">marshal</option>
            <option value="editor">editor</option>
          </select>
        </div>
        <Button onClick={createUser} disabled={submitting}>
          {submitting ? "Створення..." : "Створити"}
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-3">Список</h2>
        {loading ? <p className="text-zinc-400 text-sm">Завантаження...</p> : null}
        {!loading && users.length === 0 ? <p className="text-zinc-500 text-sm">Користувачів немає.</p> : null}

        {!loading && users.length > 0 ? (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user._id} className="rounded-lg border border-zinc-800 p-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="text-white font-semibold">{user.username}</p>
                    <p className="text-zinc-500 text-xs">
                      Останній вхід: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("uk-UA") : "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        void updateUser(user._id, { role: e.target.value as AdminRole });
                      }}
                      className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-white text-sm"
                    >
                      <option value="organizer">organizer</option>
                      <option value="marshal">marshal</option>
                      <option value="editor">editor</option>
                    </select>

                    <Button
                      size="sm"
                      variant={user.isActive ? "secondary" : "primary"}
                      onClick={() => {
                        void updateUser(user._id, { isActive: !user.isActive });
                      }}
                    >
                      {user.isActive ? "Деактивувати" : "Активувати"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      {success ? <p className="text-emerald-400 text-sm">{success}</p> : null}

      {/* Telegram alert chat settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div>
          <h2 className="text-white font-semibold">Telegram-алерти (критичні дії)</h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            Вкажіть Chat ID чату, куди бот надсилатиме сповіщення про видалення, зміну ролей тощо.
            Додайте бота в чат і надайте йому права на повідомлення. Chat ID можна дізнатись через @userinfobot.
          </p>
        </div>
        {alertChatLoading ? (
          <p className="text-zinc-500 text-sm">Завантаження...</p>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={alertChatId}
              onChange={(e) => setAlertChatId(e.target.value)}
              placeholder="-1001234567890"
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm flex-1 max-w-xs font-mono"
            />
            <Button onClick={saveAlertChat} disabled={alertChatSaving}>
              {alertChatSaving ? "Збереження..." : "Зберегти"}
            </Button>
            {alertChatId && (
              <button
                onClick={() => { setAlertChatId(""); void saveAlertChat(); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                × Очистити
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
