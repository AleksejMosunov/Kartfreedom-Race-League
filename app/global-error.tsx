"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

type GlobalErrorProps = {
  error: Error & { digest?: string; };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
          <h1 className="text-xl font-bold">Сталася помилка</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Спробуйте оновити сторінку. Якщо проблема повторюється, спробуйте пізніше.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-[#ccff00] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95"
          >
            Спробувати ще раз
          </button>
        </div>
      </body>
    </html>
  );
}
