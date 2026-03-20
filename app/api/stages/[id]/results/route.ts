import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { getPointsByPosition } from "@/lib/utils/championship";
import { requireCurrentChampionship } from "@/lib/championship/current";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { logAudit, getAuditIp, sanitizeForAudit, Change } from "@/lib/audit";

interface Params {
  params: Promise<{ id: string }>;
}

interface ResultInput {
  pilotId: string;
  position: number;
  dnf?: boolean;
  dns?: boolean;
  bestLap?: boolean;
  penaltyPoints?: number;
  penaltyReason?: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  await connectToDatabase();
  let current;
  try {
    const championshipId = req.nextUrl.searchParams.get("championship");
    current = championshipId
      ? await Championship.findById(championshipId).lean()
      : await requireCurrentChampionship();
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  const { id } = await params;
  const body = await req.json();
  const { results }: { results: ResultInput[] } = body;

  if (!current) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json(
      { error: "Results are required" },
      { status: 400 },
    );
  }

  for (const row of results) {
    const penaltyPoints = Math.max(0, Number(row.penaltyPoints ?? 0));
    const penaltyReason = (row.penaltyReason ?? "").trim();
    if (penaltyPoints > 0 && !penaltyReason) {
      return NextResponse.json(
        { error: "Для штрафу потрібно вказати причину" },
        { status: 400 },
      );
    }
  }

  const fastestLapRows = results.filter((row) => Boolean(row.bestLap));
  if (current.fastestLapBonusEnabled && fastestLapRows.length > 1) {
    return NextResponse.json(
      { error: "Best lap може бути лише у одного учасника" },
      { status: 400 },
    );
  }

  const enrichedResults = results.map((r) => {
    const fastestLapBonus =
      current.fastestLapBonusEnabled && r.bestLap && !r.dnf && !r.dns ? 1 : 0;
    const penaltyPoints = Math.max(0, Number(r.penaltyPoints ?? 0));
    // pilot league lookup will be filled below; default to 'newbie'
    const pilotLeague = "newbie" as "pro" | "newbie";
    const basePoints =
      r.dnf || r.dns ? 0 : getPointsByPosition(r.position, pilotLeague);
    const penaltyReason =
      penaltyPoints > 0 ? (r.penaltyReason ?? "").trim() : "";

    return {
      pilotId: r.pilotId,
      position: r.position,
      points: basePoints + fastestLapBonus - penaltyPoints,
      dnf: r.dnf ?? false,
      dns: r.dns ?? false,
      bestLap: current.fastestLapBonusEnabled ? Boolean(r.bestLap) : false,
      penaltyPoints,
      penaltyReason,
    };
  });

  // Ensure points reflect pilot leagues (pro x2). We need to fetch pilots to read their league.
  try {
    const pilotIds = Array.from(
      new Set(results.map((r) => String(r.pilotId))),
    ).filter(Boolean);
    if (pilotIds.length) {
      const pilots = await Pilot.find({ _id: { $in: pilotIds } }).lean();
      const leagueById = new Map(
        pilots.map((p) => [String(p._id), p.league ?? "newbie"]),
      );
      for (const row of enrichedResults) {
        const id = String(row.pilotId);
        const league = (leagueById.get(id) as "pro" | "newbie") ?? "newbie";
        const fastestLapBonus =
          current.fastestLapBonusEnabled && row.bestLap && !row.dnf && !row.dns
            ? 1
            : 0;
        const base =
          row.dnf || row.dns ? 0 : getPointsByPosition(row.position, league);
        row.points = base + fastestLapBonus - (row.penaltyPoints ?? 0);
      }
    }
  } catch {
    // If pilot lookup fails, keep computed defaults (assume newbie)
  }

  // Snapshot before state for audit log
  const stageBefore = await Stage.findOne({
    _id: id,
    championshipId: current._id,
  })
    .select({ results: 1, name: 1, number: 1 })
    .lean();

  const stage =
    current.championshipType === "teams"
      ? await Stage.findOneAndUpdate(
          { _id: id, championshipId: current._id },
          { results: enrichedResults, isCompleted: true },
          { returnDocument: "after", runValidators: true },
        ).lean()
      : await Stage.findOneAndUpdate(
          { _id: id, championshipId: current._id },
          { results: enrichedResults, isCompleted: true },
          { returnDocument: "after", runValidators: true },
        )
          .populate("results.pilotId", "name surname number team avatar")
          .lean();

  if (!stage)
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const stageLabel = stageBefore
    ? `Етап ${(stageBefore as Record<string, unknown>).number as number}: ${(stageBefore as Record<string, unknown>).name as string}`
    : `Етап ${id}`;
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  try {
    const before = stageBefore
      ? sanitizeForAudit({
          results: (stageBefore as Record<string, unknown>).results,
        })
      : null;
    const afterSnapshot = sanitizeForAudit({ results: enrichedResults });
    const changes: Change[] = [
      {
        type: "results_published",
        message: `Опубліковано результати: «${stageLabel}»`,
        data: { resultsCount: enrichedResults.length },
      },
    ];
    void logAudit({
      session,
      action: "update",
      entityType: "stage",
      entityId: id,
      entityLabel: stageLabel,
      before,
      after: { ...afterSnapshot, changes },
      ip: getAuditIp(req),
    });
  } catch (err) {
    console.error("Failed to write stage results audit:", err);
  }

  if (current.championshipType === "teams") {
    const teams = await Team.find({ championshipId: current._id }).lean();
    const teamById = new Map(teams.map((team) => [String(team._id), team]));
    const mappedStage = {
      ...stage,
      results: (stage.results ?? []).map((result: Record<string, unknown>) => {
        const id =
          result.pilotId !== null &&
          typeof result.pilotId === "object" &&
          "_id" in (result.pilotId as object)
            ? String((result.pilotId as { _id: unknown })._id)
            : String(result.pilotId);
        const team = teamById.get(id);
        if (!team) return result;
        return {
          ...result,
          pilot: {
            _id: String(team._id),
            name: team.name,
            surname: "",
            number: team.number,
          },
        };
      }),
    };
    return NextResponse.json(mappedStage);
  }

  return NextResponse.json(stage);
}
