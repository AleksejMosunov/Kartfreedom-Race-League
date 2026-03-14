import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { logAudit, getAuditIp } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const updated = await Championship.findOneAndUpdate(
    { _id: id, status: "active" },
    { status: "archived", endedAt: new Date() },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { error: "Active championship not found" },
      { status: 404 },
    );
  }

  const token = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  void logAudit({
    session,
    action: "finish",
    entityType: "championship",
    entityId: id,
    entityLabel: String(updated.name),
    before: { status: "active" },
    after: { status: "archived" },
    ip: getAuditIp(_req),
    alertMessage: `✅ <b>Чемпіонат завершено</b>\n«${updated.name}»\nАдмін: ${session?.username ?? "unknown"}`,
  });

  return NextResponse.json(updated);
}
