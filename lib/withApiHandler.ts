import type { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { sendAlertMessage } from "@/lib/telegram";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { connectToDatabase } from "@/lib/mongodb";

type RouteHandler<C = unknown> = (
  req: NextRequest,
  ctx: C,
) => Promise<NextResponse | Response>;

/**
 * Wraps a Next.js App Router route handler.
 * - Any unhandled throw → captured in Sentry + Telegram alert to admin chat → JSON 500.
 * - Successful responses with status 5xx also trigger an alert.
 */
export function withApiHandler<C = unknown>(
  handler: RouteHandler<C>,
  label?: string,
): RouteHandler<C> {
  return async (req: NextRequest, ctx: C) => {
    try {
      const response = await handler(req, ctx);
      if (response.status >= 500) {
        void fireAlert(req, response.status, label, null);
      }
      return response;
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          url: req.url,
          method: req.method,
          label,
        },
      });
      void fireAlert(req, 500, label, err);
      const { NextResponse: NR } = await import("next/server");
      return NR.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

async function fireAlert(
  req: NextRequest,
  status: number,
  label: string | undefined,
  err: unknown,
): Promise<void> {
  try {
    await connectToDatabase();
    const settings = await LeagueSettings.findOne({ key: "global" })
      .select({ alertChatId: 1 })
      .lean();
    const chatId = settings?.alertChatId;
    if (!chatId) return;

    const route = new URL(req.url).pathname;
    const errorMsg =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : typeof err === "string"
          ? err
          : "Unknown error";

    const text = [
      `🚨 <b>5xx помилка</b>`,
      `Статус: <code>${status}</code>`,
      `Маршрут: <code>${req.method} ${route}</code>`,
      label ? `Хендлер: <code>${label}</code>` : null,
      err ? `Помилка: <code>${errorMsg.slice(0, 300)}</code>` : null,
      `Час: ${new Date().toLocaleString("uk-UA")}`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendAlertMessage(chatId, text);
  } catch {
    // best-effort
  }
}
