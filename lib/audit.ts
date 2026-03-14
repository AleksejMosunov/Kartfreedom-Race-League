import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog, AuditAction, AuditEntityType } from "@/lib/models/AuditLog";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { sendAlertMessage } from "@/lib/telegram";

export type { AuditAction, AuditEntityType };

export interface AuditSession {
  userId: string;
  username: string;
}

interface AuditOptions {
  session?: AuditSession | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  /** When set, sends a Telegram alert to the configured admin alert chat. */
  alertMessage?: string;
}

/** Strip PII fields before storing in audit log snapshots. */
export function sanitizeForAudit(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const { phone: _p, passwordHash: _h, ...rest } = obj;
  return rest;
}

/** Extract approximate client IP from request headers. */
export function getAuditIp(req: {
  headers: { get(name: string): string | null };
}): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
}

export async function logAudit(opts: AuditOptions): Promise<void> {
  // Write to DB first (non-blocking for callers — errors are caught)
  try {
    await connectToDatabase();
    await AuditLog.create({
      adminUserId: opts.session?.userId ?? null,
      adminUsername: opts.session?.username ?? "unknown",
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      entityLabel: opts.entityLabel,
      before: opts.before ?? null,
      after: opts.after ?? null,
      ip: opts.ip ?? "",
    });
  } catch (err) {
    console.error("[audit] Failed to write log:", err);
  }

  // Send Telegram alert (fire-and-forget, never throws)
  if (opts.alertMessage) {
    void sendCriticalAlert(opts.alertMessage);
  }
}

async function sendCriticalAlert(message: string): Promise<void> {
  try {
    const settings = await LeagueSettings.findOne({ key: "global" })
      .select({ alertChatId: 1 })
      .lean();
    const chatId = settings?.alertChatId;
    if (!chatId) return;
    await sendAlertMessage(chatId, message);
  } catch (err) {
    console.error("[audit] Failed to send Telegram alert:", err);
  }
}
