import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, AdminUserRole } from "@/lib/models/AdminUser";
import {
  AUTH_COOKIE_NAME,
  getAuthenticatedAdminSession,
  hashAdminPassword,
} from "@/lib/auth";
import { logAudit, getAuditIp, sanitizeForAudit, Change } from "@/lib/audit";

function forbidden() {
  return NextResponse.json({ error: "Недостатньо прав" }, { status: 403 });
}

function unauthorized() {
  return NextResponse.json(
    { error: "Admin authorization required" },
    { status: 401 },
  );
}

async function requireOrganizer(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  if (!session) return { ok: false as const, response: unauthorized() };
  if (session.role !== "organizer")
    return { ok: false as const, response: forbidden() };
  return { ok: true as const, session };
}

function isRole(value: unknown): value is AdminUserRole {
  return value === "organizer" || value === "marshal" || value === "editor";
}

function isStrongPassword(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireOrganizer(req);
  if (!auth.ok) return auth.response;

  await connectToDatabase();
  const users = await AdminUser.find()
    .sort({ createdAt: 1 })
    .select({
      username: 1,
      role: 1,
      isActive: 1,
      lastLoginAt: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .lean();

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireOrganizer(req);
  if (!auth.ok) return auth.response;

  await connectToDatabase();
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    role?: AdminUserRole;
    isActive?: boolean;
  };

  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role;

  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "Username має містити щонайменше 3 символи" },
      { status: 400 },
    );
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Пароль має містити щонайменше 12 символів, великі та малі літери і цифру",
      },
      { status: 400 },
    );
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: "Невірна роль" }, { status: 400 });
  }

  const existing = await AdminUser.findOne({ username }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "Користувач з таким username вже існує" },
      { status: 409 },
    );
  }

  const created = await AdminUser.create({
    username,
    passwordHash: hashAdminPassword(password),
    role,
    isActive: body.isActive !== false,
  });

  try {
    const afterSnapshot = sanitizeForAudit({
      username,
      role,
      isActive: body.isActive !== false,
    });
    const changes: Change[] = [
      {
        type: "created_admin_user",
        message: `Створено адміністратора: «${username}» (роль: ${role})`,
      },
    ];
    void logAudit({
      session: auth.session,
      action: "create_user",
      entityType: "admin_user",
      entityId: String(created._id),
      entityLabel: username,
      after: { ...afterSnapshot, changes },
      ip: getAuditIp(req),
      alertMessage: `👤 <b>Новий адміністратор</b>\n${username} (роль: ${role})\nСтворено: ${auth.session.username}`,
    });
  } catch (err) {
    console.error("Failed to write admin user create audit:", err);
  }

  return NextResponse.json(
    {
      user: {
        _id: String(created._id),
        username: created.username,
        role: created.role,
        isActive: created.isActive,
        lastLoginAt: created.lastLoginAt ?? null,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    },
    { status: 201 },
  );
}
