import { defaultRegulationsForNewChampionship } from "@/lib/championship/regulations";
import { normalizeRegulationsPayload } from "@/lib/championship/regulations";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { logAudit, getAuditIp, sanitizeForAudit, Change } from "@/lib/audit";
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
      sprint: settings?.preseasonNewsSprint ?? settings?.preseasonNews ?? "",
      sprintPro: settings?.preseasonNewsSprintPro ?? "",
    },
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    championshipType?: "sprint" | "sprint-pro";
    fastestLapBonusEnabled?: boolean;
    prizes?: { place?: string; description?: string }[];
    regulations?: {
      title?: string;
      intro?: string;
      sections?: Array<{ title?: string; content?: string }>;
      startedAt?: string | number | Date;
    };
  };
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `Чемпіонат ${new Date().toLocaleDateString("uk-UA")}`;
  if (
    body.championshipType !== "sprint" &&
    body.championshipType !== "sprint-pro"
  ) {
    return NextResponse.json(
      { error: "Оберіть формат чемпіонату: Sprint або Sprint (Pro)" },
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

  let providedStart: Date | null = null;
  if ((body as any).startedAt) {
    const tmp = new Date((body as any).startedAt);
    if (!Number.isNaN(tmp.getTime())) providedStart = tmp;
  }

  const created = await Championship.create({
    name,
    status: "active",
    championshipType,
    fastestLapBonusEnabled,
    startedAt: providedStart ?? new Date(),
    regulations:
      regulations ??
      defaultRegulationsForNewChampionship(fastestLapBonusEnabled),
    prizes,
  });

  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = await getAuthenticatedAdminSession(token);
    const afterSnapshot = sanitizeForAudit({
      name,
      championshipType,
      fastestLapBonusEnabled,
    });
    const changes: Change[] = [
      {
        type: "created_championship",
        message: `Створено чемпіонат: «${name}»`,
      },
    ];
    void logAudit({
      session,
      action: "create",
      entityType: "championship",
      entityId: String(created._id),
      entityLabel: name,
      after: { ...afterSnapshot, changes },
      ip: getAuditIp(req),
    });
  } catch (err) {
    console.error("Failed to write championship create audit:", err);
  }

  return NextResponse.json(created, { status: 201 });
}
