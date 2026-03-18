import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";
import {
  championshipLinkLine,
  escapeHtml,
  sendTelegramMessage,
} from "@/lib/telegram";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json().catch(() => ({}))) as {
    championshipId?: string;
  };
  if (!body.championshipId) {
    return NextResponse.json(
      { error: "championshipId is required" },
      { status: 400 },
    );
  }

  const championship = await Championship.findById(body.championshipId).lean();
  if (!championship) {
    return NextResponse.json(
      { error: "Чемпіонат не знайдено" },
      { status: 404 },
    );
  }

  const [participantsRaw, stagesRaw] = await Promise.all([
    Pilot.find({ championshipId: championship._id }).sort({ number: 1 }).lean(),
    Stage.find({ championshipId: championship._id }).sort({ number: 1 }).lean(),
  ]);

  const participants = participantsRaw as unknown as IPilotType[];
  const stages = stagesRaw as unknown as IStageType[];

  const standings = calculateChampionshipStandings(
    participants,
    stages,
    championship.championshipType === "sprint-pro" ? "sprint-pro" : "sprint",
  );
  const top3 = standings.slice(0, 3);

  const medals = ["🥇", "🥈", "🥉"];
  const podium = top3.map((row, idx) => {
    const title = row.pilot.surname
      ? `#${row.pilot.number} ${row.pilot.name} ${row.pilot.surname}`
      : `#${row.pilot.number} ${row.pilot.name}`;
    return `${medals[idx]} <b>${escapeHtml(title)}</b> — ${row.totalPoints} очк.`;
  });

  const message = [
    "🏆 <b>Чемпіонат завершено!</b>",
    `Назва: <b>${escapeHtml(championship.name)}</b>`,
    `Формат: <b>${championship.championshipType === "sprint-pro" ? "Sprint PRO" : "Sprint"}</b>`,
    "",
    ...podium,
    "",
    top3[0]
      ? "Вітаємо чемпіона та призерів сезону! 🎉"
      : "Підсумки чемпіонату опубліковано.",
    "",
    championshipLinkLine(String(championship._id)),
  ].join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
