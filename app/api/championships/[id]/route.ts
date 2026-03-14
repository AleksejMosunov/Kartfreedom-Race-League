import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";
import {
  AUTH_COOKIE_NAME,
  isValidAdminSession,
  getAuthenticatedAdminSession,
} from "@/lib/auth";
import { logAudit, getAuditIp } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const sessionToken = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(sessionToken);
  const { id } = await params;

  const championship = await Championship.findById(id).lean();
  if (!championship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [participants, stages] = await Promise.all([
    championship.championshipType === "teams"
      ? Team.find({ championshipId: id })
          .sort({ number: 1, name: 1 })
          .lean()
          .then((teams) =>
            teams.map((team) => ({
              _id: String(team._id),
              name: team.name,
              surname: "",
              number: team.number,
            })),
          )
      : Pilot.find({ championshipId: id }).sort({ number: 1 }).lean(),
    championship.championshipType === "teams"
      ? Stage.find({ championshipId: id }).sort({ number: 1 }).lean()
      : Stage.find({ championshipId: id })
          .populate("results.pilotId", "name surname number team avatar")
          .sort({ number: 1 })
          .lean(),
  ]);

  const mappedStages =
    championship.championshipType === "teams"
      ? (() => {
          const teamById = new Map(
            (
              participants as Array<{
                _id: string;
                name: string;
                number: number;
              }>
            ).map((team) => [String(team._id), team]),
          );
          return stages.map((stage) => ({
            ...stage,
            results: (stage.results ?? []).map(
              (result: Record<string, unknown>) => {
                const idStr =
                  result.pilotId !== null &&
                  typeof result.pilotId === "object" &&
                  "_id" in (result.pilotId as object)
                    ? String((result.pilotId as { _id: unknown })._id)
                    : String(result.pilotId);
                const team = teamById.get(idStr);
                if (!team) return result;
                return {
                  ...result,
                  pilot: {
                    _id: team._id,
                    name: team.name,
                    surname: "",
                    number: team.number,
                  },
                };
              },
            ),
          }));
        })()
      : stages;

  const safeParticipants = isAdmin
    ? participants
    : (participants as Array<Record<string, unknown>>).map((participant) => {
        const { phone: _phone, ...rest } = participant;
        return rest;
      });

  const standings = calculateChampionshipStandings(
    safeParticipants as unknown as IPilotType[],
    mappedStages as unknown as IStageType[],
    championship.championshipType === "teams" ? "teams" : "solo",
  );

  return NextResponse.json({
    championship,
    pilots: safeParticipants,
    stages: mappedStages,
    standings,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const championship = await Championship.findById(id).lean();
  if (!championship) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (championship.status === "active") {
    return NextResponse.json(
      {
        error: "Не можна видалити активний чемпіонат. Спочатку завершіть його.",
      },
      { status: 409 },
    );
  }

  await Championship.deleteOne({ _id: id });

  const token = _req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  void logAudit({
    session,
    action: "delete",
    entityType: "championship",
    entityId: id,
    entityLabel: String(championship.name),
    ip: getAuditIp(_req),
    alertMessage: `⛔ <b>Чемпіонат видалено</b>\n«${championship.name}»\nАдмін: ${session?.username ?? "unknown"}`,
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as {
    fastestLapBonusEnabled?: boolean;
    prizes?: { place?: string; description?: string }[];
  };

  const update: Record<string, unknown> = {};

  if (typeof body.fastestLapBonusEnabled === "boolean") {
    update.fastestLapBonusEnabled = body.fastestLapBonusEnabled;
  }

  if (Array.isArray(body.prizes)) {
    const prizes = body.prizes
      .filter(
        (p) =>
          typeof p.place === "string" &&
          p.place.trim() &&
          typeof p.description === "string" &&
          p.description.trim(),
      )
      .map((p) => ({
        place: (p.place as string).trim(),
        description: (p.description as string).trim(),
      }));
    update.prizes = prizes;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Нічого для оновлення" },
      { status: 400 },
    );
  }

  const updated = await Championship.findByIdAndUpdate(id, update, {
    new: true,
  }).lean();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
