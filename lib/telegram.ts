const TELEGRAM_API_BASE = "https://api.telegram.org";
const DEFAULT_APP_BASE_URL = "https://kartfreedom-race-league.vercel.app";

function requiredEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function isTelegramConfigured() {
  return Boolean(
    requiredEnv("TELEGRAM_BOT_TOKEN") && requiredEnv("TELEGRAM_CHAT_ID"),
  );
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function webAppLinkLine() {
  return `🔗 <a href="${buildAppUrl("/register")}">Веб-застосунок KartFreedom Race League</a>`;
}

function appBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return DEFAULT_APP_BASE_URL;
}

function buildAppUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${appBaseUrl()}${normalized}`;
}

export function registrationLinkLine(championshipId?: string) {
  const query = championshipId
    ? `?championship=${encodeURIComponent(championshipId)}`
    : "";
  return `🔗 <a href="${buildAppUrl(`/register${query}`)}">Реєстрація KartFreedom Race League</a>`;
}

export function championshipLinkLine(championshipId: string) {
  return `🔗 <a href="${buildAppUrl(`/championship/${encodeURIComponent(championshipId)}`)}">Результати чемпіонату</a>`;
}

export function stageLinkLine(stageId: string) {
  return `🔗 <a href="${buildAppUrl(`/stages/${encodeURIComponent(stageId)}`)}">Інформація про етап</a>`;
}

export function stageResultsLinkLine(stageId: string, championshipId?: string) {
  const query = championshipId
    ? `?championship=${encodeURIComponent(championshipId)}`
    : "";
  return `🔗 <a href="${buildAppUrl(`/stages/${encodeURIComponent(stageId)}${query}`)}">Результати етапу</a>`;
}

export async function sendTelegramMessage(text: string) {
  const botToken = requiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = requiredEnv("TELEGRAM_CHAT_ID");

  if (!botToken || !chatId) {
    throw new Error(
      "Telegram не налаштований. Додайте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID в .env.local",
    );
  }

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    description?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.description ?? "Помилка відправки повідомлення в Telegram",
    );
  }

  return payload;
}

/**
 * Send a message to a specific chat (used for admin alert notifications).
 * Fire-and-forget — errors are swallowed to never block the request flow.
 */
export async function sendAlertMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const botToken = requiredEnv("TELEGRAM_BOT_TOKEN");
  if (!botToken || !chatId) return;

  try {
    await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // best-effort delivery; do not surface errors to callers
  }
}
