import { defaultRegulationsForNewChampionship } from "@/lib/championship/regulations";
import { normalizeRegulationsPayload } from "@/lib/championship/regulations";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { logAudit, getAuditIp } from "@/lib/audit";
import { normalizeSocialLinks, SocialLinks } from "@/lib/socialLinks";

const SETTINGS_KEY = "global";

export async function GET() {
  await connectToDatabase();

  const [active, archived, settings] = await Promise.all([
    Championship.find({ status: "active" }).sort({ startedAt: -1 }).lean(),
    Championship.find({ status: "archived" })
      .sort({ endedAt: -1, startedAt: -1 })
      .lean(),
    LeagueSettings.findOne({ key: SETTINGS_KEY }).lean(),
  ]);

  return NextResponse.json({
    active,
    current: active[0] ?? null,
    archived,
    preseasonNews: settings?.preseasonNews ?? "",
    socialLinks: normalizeSocialLinks(
      settings?.socialLinks as Partial<SocialLinks> | undefined,
    ),
    preseasonNewsByType: {
      solo: settings?.preseasonNewsSolo ?? settings?.preseasonNews ?? "",
      teams: settings?.preseasonNewsTeams ?? "",
    },
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    championshipType?: "solo" | "teams" | "sprint-pro";
    fastestLapBonusEnabled?: boolean;
    prizes?: { place?: string; description?: string }[];
    regulations?: {
      title?: string;
      intro?: string;
      sections?: Array<{ title?: string; content?: string }>;
    };
  };
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `Чемпіонат ${new Date().toLocaleDateString("uk-UA")}`;
  if (
    body.championshipType !== "solo" &&
    body.championshipType !== "teams" &&
    body.championshipType !== "sprint-pro"
  ) {
    return NextResponse.json(
      {
        error: "Оберіть формат чемпіонату: Sprint, Sprint (Pro) або Endurance",
      },
      { status: 400 },
    );
  }

  const prizes = Array.isArray(body.prizes)
    ? body.prizes
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
        }))
    : [];

  const championshipType = body.championshipType;
  const fastestLapBonusEnabled = Boolean(body.fastestLapBonusEnabled);
  const regulations = normalizeRegulationsPayload(body.regulations ?? {});

  if (body.regulations && !regulations) {
    return NextResponse.json(
      { error: "Заповніть регламент: заголовок, вступ і хоча б один пункт" },
      { status: 400 },
    );
  }

  const created = await Championship.create({
    name,
    status: "active",
    championshipType,
    fastestLapBonusEnabled,
    startedAt: new Date(),
    regulations:
      regulations ??
      defaultRegulationsForNewChampionship(fastestLapBonusEnabled),
    prizes,
  });

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  void logAudit({
    session,
    action: "create",
    entityType: "championship",
    entityId: String(created._id),
    entityLabel: name,
    after: { name, championshipType, fastestLapBonusEnabled },
    ip: getAuditIp(req),
  });

  return NextResponse.json(created, { status: 201 });
}
