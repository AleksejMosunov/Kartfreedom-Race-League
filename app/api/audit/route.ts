import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/AuditLog";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "organizer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
