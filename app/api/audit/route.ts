import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/AuditLog";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";

type CleanupScope = "all" | "today" | "week" | "month";

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
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  const action = sp.get("action");
  const entityType = sp.get("entityType");
  const adminUsername = sp.get("adminUsername");
  const from = sp.get("from");
  const to = sp.get("to");

  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (adminUsername)
    filter.adminUsername = { $regex: adminUsername, $options: "i" };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
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
