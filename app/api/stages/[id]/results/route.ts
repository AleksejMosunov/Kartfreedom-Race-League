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
    if (championshipId) {
      current = await Championship.findById(championshipId).lean();
    } else {
      // Guard against possible module interop/circular-import issues where
      // `requireCurrentChampionship` may not be a callable function at runtime.
      if (typeof requireCurrentChampionship === "function") {
        current = await requireCurrentChampionship();
      } else {
        // Fallback: query the DB directly for an active championship.
        current = await Championship.findOne({ status: "active" })
          .sort({ startedAt: -1 })
          .lean();
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Немає активного чемпіонату" },
      { status: 409 },
    );
  }
  const { id } = await params;
  const body = await req.json();
  const {
    results,
    raceIndex = 0,
  }: { results: ResultInput[]; raceIndex?: number } = body;

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

  // Determine participants count for this race (exclude explicit DNS when possible)
  const participantsCount = Math.max(
    1,
    results.filter((r) => !r.dns).length || results.length,
  );

  const enrichedResults = results.map((r) => {
    const fastestLapBonus =
      current.fastestLapBonusEnabled && r.bestLap && !r.dnf && !r.dns ? 1 : 0;
    const penaltyPoints = Math.max(0, Number(r.penaltyPoints ?? 0));
    const basePoints =
      r.dnf || r.dns ? 0 : getPointsByPosition(r.position, participantsCount);
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
      await Pilot.find({ _id: { $in: pilotIds } }).lean();
      // league adjustments intentionally omitted — keep computed defaults
      for (const row of enrichedResults) {
        const fastestLapBonus =
          current.fastestLapBonusEnabled && row.bestLap && !row.dnf && !row.dns
            ? 1
            : 0;
        const base =
          row.dnf || row.dns
            ? 0
            : getPointsByPosition(row.position, participantsCount);
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
    .select({ races: 1, name: 1, number: 1 })
    .lean();

  // Update the specific race results (default raceIndex = 0). Determine whether stage
  // is completed only when all races have non-empty results.
  const stageQuery = { _id: id, championshipId: current._id };

  // Prepare update document: set races.<raceIndex>.results = enrichedResults
  const setPath = `races.${Number(raceIndex)}.results`;

  // compute isCompleted: after update, check if all races have results length > 0
  const stageAfterTemp = await Stage.findOne(stageQuery)
    .select({ races: 1 })
    .lean();
  const racesCurrent = (stageAfterTemp?.races as any[]) ?? [];
  // ensure array has at least raceIndex+1 entries
  while (racesCurrent.length <= raceIndex) {
    racesCurrent.push({ swsLink: "", results: [] });
  }
  racesCurrent[Number(raceIndex)] = {
    ...(racesCurrent[Number(raceIndex)] ?? {}),
    results: enrichedResults,
  };
  const isCompletedAfter = racesCurrent.every(
    (r) => Array.isArray(r.results) && r.results.length > 0,
  );

  // Round points to integer for storage/display as requested (calculations remain float)
  enrichedResults.forEach((row) => {
    row.points = Math.round(Number(row.points) || 0);
  });

  const updateDoc: any = {
    $set: {
      [setPath]: enrichedResults,
      isCompleted: isCompletedAfter,
    },
  };

  let stage;
  if (current.championshipType === "teams") {
    stage = await Stage.findOneAndUpdate(stageQuery, updateDoc, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
  } else {
    stage = await Stage.findOneAndUpdate(stageQuery, updateDoc, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("races.results.pilotId", "name surname number team avatar")
      .lean();
  }

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
          races: (stageBefore as Record<string, unknown>).races,
        })
      : null;
    const afterSnapshot = sanitizeForAudit({ races: racesCurrent });
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
      races: ((stage as any).races ?? []).map((race: any) => ({
        ...race,
        results: (race.results ?? []).map((result: Record<string, unknown>) => {
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
      })),
    };
    return NextResponse.json(mappedStage);
  }

  return NextResponse.json(stage);
}
