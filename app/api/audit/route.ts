import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/AuditLog";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";

type CleanupScope = "all" | "today" | "week" | "month";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function requireOrganizer(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.role !== "organizer") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, session };
}

function getCleanupFilter(scope: CleanupScope) {
  if (scope === "all") return {};

  const now = new Date();
  const start = new Date(now);

  if (scope === "today") {
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }

  if (scope === "week") {
    start.setDate(start.getDate() - 7);
    return { createdAt: { $gte: start } };
  }

  start.setMonth(start.getMonth() - 1);
  return { createdAt: { $gte: start } };
}

export async function GET(req: NextRequest) {
  const auth = await requireOrganizer(req);
  if (!auth.ok) return auth.response;

  await connectToDatabase();
  const sp = req.nextUrl.searchParams;
  const pageParam = Number(sp.get("page") ?? 1);
  const limitParam = Number(sp.get("limit") ?? 20);
  const page =
    Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam >= 1
      ? Math.min(100, Math.floor(limitParam))
      : 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  const action = sp.get("action");
  const entityType = sp.get("entityType");
  const adminUsername = sp.get("adminUsername");
  const from = sp.get("from");
  const to = sp.get("to");

  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (adminUsername) {
    const normalized = adminUsername.trim();
    if (normalized.length > 64) {
      return NextResponse.json(
        { error: "adminUsername is too long" },
        { status: 400 },
      );
    }
    filter.adminUsername = {
      $regex: escapeRegex(normalized),
      $options: "i",
    };
  }
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) {
      const fromDate = parseDateParam(from);
      if (!fromDate) {
        return NextResponse.json(
          { error: "Invalid from date" },
          { status: 400 },
        );
      }
      dateFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = parseDateParam(to);
      if (!toDate) {
        return NextResponse.json({ error: "Invalid to date" }, { status: 400 });
      }
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }
    if (
      dateFilter.$gte &&
      dateFilter.$lte &&
      dateFilter.$gte.getTime() > dateFilter.$lte.getTime()
    ) {
      return NextResponse.json(
        { error: "from date must be less than or equal to to date" },
        { status: 400 },
      );
    }
    filter.createdAt = dateFilter;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireOrganizer(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as {
    scope?: CleanupScope;
  };
  const scope = body.scope;

  if (
    scope !== "all" &&
    scope !== "today" &&
    scope !== "week" &&
    scope !== "month"
  ) {
    return NextResponse.json(
      { error: "Invalid cleanup scope" },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const result = await AuditLog.deleteMany(getCleanupFilter(scope));

  return NextResponse.json({
    ok: true,
    scope,
    deletedCount: result.deletedCount ?? 0,
  });
}
