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

  const toRestore = await Championship.findById(id).lean();
  if (!toRestore) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }

  if (toRestore.status !== "archived") {
    return NextResponse.json(
      { error: "Відновити можна лише чемпіонат з архіву" },
      { status: 409 },
    );
  }

  const restored = await Championship.findByIdAndUpdate(
    id,
    {
      status: "active",
      $unset: { endedAt: "" },
    },
    { new: true },
  ).lean();

  const token = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  void logAudit({
    session,
    action: "restore",
    entityType: "championship",
    entityId: id,
    entityLabel: String(restored!.name),
    before: { status: "archived" },
    after: { status: "active" },
    ip: getAuditIp(_req),
    alertMessage: `↩️ <b>Чемпіонат відновлено</b>\n«${restored!.name}»\nАдмін: ${session?.username ?? "unknown"}`,
  });

  return NextResponse.json(restored);
}
