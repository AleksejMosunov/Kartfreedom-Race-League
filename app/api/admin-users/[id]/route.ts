import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, AdminUserRole } from "@/lib/models/AdminUser";
import {
  AUTH_COOKIE_NAME,
  getAuthenticatedAdminSession,
  hashAdminPassword,
} from "@/lib/auth";
import { logAudit, getAuditIp, sanitizeForAudit, Change } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

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

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireOrganizer(req);
  if (!auth.ok) return auth.response;

  await connectToDatabase();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    role?: AdminUserRole;
    isActive?: boolean;
    password?: string;
  };

  const user = await AdminUser.findById(id);
  if (!user) {
    return NextResponse.json(
      { error: "Користувача не знайдено" },
      { status: 404 },
    );
  }

  const updates: Record<string, unknown> = {};

  if (body.role !== undefined) {
    if (!isRole(body.role)) {
      return NextResponse.json({ error: "Невірна роль" }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (typeof body.isActive === "boolean") {
    updates.isActive = body.isActive;
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Пароль має містити щонайменше 6 символів" },
        { status: 400 },
      );
    }
    updates.passwordHash = hashAdminPassword(body.password);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Немає змін для застосування" },
      { status: 400 },
    );
  }

  // Safety: keep at least one active organizer.
  const nextRole = (updates.role as AdminUserRole | undefined) ?? user.role;
  const nextActive = (updates.isActive as boolean | undefined) ?? user.isActive;
  if (
    (user.role === "organizer" || nextRole === "organizer") &&
    !(nextRole === "organizer" && nextActive)
  ) {
    const organizersCount = await AdminUser.countDocuments({
      role: "organizer",
      isActive: true,
    });
    if (organizersCount <= 1) {
      return NextResponse.json(
        { error: "Потрібно залишити щонайменше одного активного organizer" },
        { status: 409 },
      );
    }
  }

  const updated = await AdminUser.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .select({
      username: 1,
      role: 1,
      isActive: 1,
      lastLoginAt: 1,
      createdAt: 1,
      updatedAt: 1,
    })
    .lean();

  // Determine audit action and optional alert
  let action: "role_change" | "deactivate" | "activate" | "update" = "update";
  let alertMessage: string | undefined;
  const actor = auth.session.username;
  const targetName = user.username;

  if (updates.role !== undefined && updates.role !== user.role) {
    action = "role_change";
    alertMessage = `🔑 <b>Зміна ролі</b>\n${targetName}: ${user.role} → ${String(updates.role)}\nАдмін: ${actor}`;
  } else if (updates.isActive === false && user.isActive) {
    action = "deactivate";
    alertMessage = `🔒 <b>Адмін деактивований</b>\n${targetName}\nАдмін: ${actor}`;
  } else if (updates.isActive === true && !user.isActive) {
    action = "activate";
  }

  try {
    const changes: Change[] = [];
    if (updates.role !== undefined && updates.role !== user.role) {
      changes.push({
        type: "role_changed",
        message: `Змінено роль: ${user.role} → ${String(updates.role)}`,
        data: { before: user.role, after: updates.role },
      });
    }
    if (updates.isActive === false && user.isActive) {
      changes.push({
        type: "deactivated",
        message: `Деактивовано користувача: «${targetName}»`,
      });
    } else if (updates.isActive === true && !user.isActive) {
      changes.push({
        type: "activated",
        message: `Активовано користувача: «${targetName}»`,
      });
    }
    if (updates.passwordHash) {
      changes.push({
        type: "password_reset",
        message: `Змінено пароль для «${targetName}»`,
      });
    }

    const beforeSnapshot = sanitizeForAudit({
      role: user.role,
      isActive: user.isActive,
    });
    const afterSnapshot = sanitizeForAudit({
      role: updated?.role ?? user.role,
      isActive: updated?.isActive ?? user.isActive,
    });

    void logAudit({
      session: auth.session,
      action,
      entityType: "admin_user",
      entityId: id,
      entityLabel: targetName,
      before: beforeSnapshot,
      after: { ...afterSnapshot, changes },
      ip: getAuditIp(req),
      alertMessage,
    });
  } catch (err) {
    console.error("Failed to write admin user update audit:", err);
  }

  return NextResponse.json({ user: updated });
}
