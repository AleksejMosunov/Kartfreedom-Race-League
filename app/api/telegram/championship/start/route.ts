import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import {
  escapeHtml,
  registrationLinkLine,
  sendTelegramMessage,
  championshipLinkLine,
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

  const message = [
    "🏁 <b>Старт нового чемпіонату!</b>",
    `Назва: <b>${escapeHtml(championship.name)}</b>`,
    `Формат: <b>${championship.championshipType === "teams" ? "Endurance" : "Sprint"}</b>`,
    `Дата старту: <b>${new Date(championship.startedAt).toLocaleDateString("uk-UA")}</b>`,
    championship.fastestLapBonusEnabled
      ? "Правило: <b>Best lap +1 очко</b> увімкнено"
      : "Правило: <b>Best lap +1 очко</b> вимкнено",
    "",
    "Реєстрацію відкрито. Успіхів усім учасникам! 🔥",
    "",
    registrationLinkLine(String(championship._id)),
    championshipLinkLine(String(championship._id)),
  ].join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
