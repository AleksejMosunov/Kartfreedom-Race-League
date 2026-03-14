import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { AdminUser } from "@/lib/models/AdminUser";
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

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeChampionships,
    archivedChampionships,
    totalPilots,
    totalTeams,
    totalStages,
    completedStages,
    totalAdminUsers,
    activeAdminUsers,
    auditLast30d,
    auditLast7d,
    auditByAction,
    auditByEntity,
  ] = await Promise.all([
    Championship.countDocuments({ status: "active" }),
    Championship.countDocuments({ status: "archived" }),
    Pilot.countDocuments({}),
    Team.countDocuments({}),
    Stage.countDocuments({}),
    Stage.countDocuments({ isCompleted: true }),
    AdminUser.countDocuments({}),
    AdminUser.countDocuments({ isActive: true }),
    AuditLog.countDocuments({ createdAt: { $gte: since30d } }),
    AuditLog.countDocuments({ createdAt: { $gte: since7d } }),
    AuditLog.aggregate([
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]) as Promise<Array<{ _id: string; count: number }>>,
    AuditLog.aggregate([
      { $group: { _id: "$entityType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]) as Promise<Array<{ _id: string; count: number }>>,
  ]);

  // Recent 5 audit entries
  const recentAudit = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select({ action: 1, entityType: 1, entityLabel: 1, adminUsername: 1, createdAt: 1 })
    .lean();

  return NextResponse.json({
    championships: { active: activeChampionships, archived: archivedChampionships },
    participants: { pilots: totalPilots, teams: totalTeams },
    stages: { total: totalStages, completed: completedStages },
    adminUsers: { total: totalAdminUsers, active: activeAdminUsers },
    auditActivity: {
      last7d: auditLast7d,
      last30d: auditLast30d,
      byAction: auditByAction,
      byEntity: auditByEntity,
    },
    recentAudit,
    generatedAt: new Date().toISOString(),
  });
}
