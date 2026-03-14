import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authenticateAdminCredentials,
  createAdminSessionToken,
  ensureBootstrapOrganizerExists,
  getBootstrapOrganizerCredentials,
  getAdminSessionCookieOptions,
} from "@/lib/auth";
import { getAuditIp, logAudit } from "@/lib/audit";
import { AdminUser } from "@/lib/models/AdminUser";
import { connectToDatabase } from "@/lib/mongodb";
import { clearRateLimit, consumeRateLimit } from "@/lib/security/rateLimit";

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    const normalizedUsername =
      typeof username === "string" ? username.trim().toLowerCase() : "";
    const ip = getAuditIp(req) || "unknown";
    const rateLimitKey = `${ip}:${normalizedUsername || "unknown"}`;
    const rateLimit = consumeRateLimit(rateLimitKey, {
      windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
      max: LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    let user = await authenticateAdminCredentials(username, password);

    if (!user) {
      const bootstrap = getBootstrapOrganizerCredentials();
      if (
        bootstrap &&
        username === bootstrap.username &&
        password === bootstrap.password
      ) {
        user = await ensureBootstrapOrganizerExists(username, password);
      }
    }

    if (!user) {
      void logAudit({
        action: "login_failed",
        entityType: "admin_user",
        entityId: normalizedUsername || "unknown",
        entityLabel: `Failed login: ${normalizedUsername || "unknown"}`,
        ip,
      });

      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    clearRateLimit(rateLimitKey);

    await connectToDatabase();
    await AdminUser.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } },
    );

    const sessionToken = await createAdminSessionToken(
      String(user._id),
      user.role,
    );
    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      sessionToken,
      getAdminSessionCookieOptions(),
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
