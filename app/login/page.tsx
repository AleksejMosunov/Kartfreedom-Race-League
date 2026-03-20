"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { apiFetch } from "@/app/services/api/request";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main className="min-h-[calc(100vh-8rem)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/95 p-8 shadow-2xl shadow-black/30">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-zinc-800" />
          <div className="h-10 w-56 rounded bg-zinc-800" />
          <div className="h-24 rounded bg-zinc-800" />
          <div className="h-11 rounded bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nextPath = searchParams.get("next") ?? "/admin";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не вдалося увійти");
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/95 p-8 shadow-2xl shadow-black/30">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-400">
            KartFreedom Admin
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">Вхід до адмін панелі</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Введіть логін і пароль адміністратора для керування етапами та пілотами.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Логін
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition-colors focus:border-red-500"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition-colors focus:border-red-500"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Вхід..." : "Увійти"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-white">
            Повернутися на сайт
          </Link>
        </div>
      </div>
    </main>
  );
}
