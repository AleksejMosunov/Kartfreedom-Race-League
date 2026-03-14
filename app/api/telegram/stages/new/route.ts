import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Championship } from "@/lib/models/Championship";
import { escapeHtml, sendTelegramMessage, stageLinkLine } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json().catch(() => ({}))) as { stageId?: string };
  if (!body.stageId) {
    return NextResponse.json({ error: "stageId is required" }, { status: 400 });
  }

  const stage = await Stage.findById(body.stageId).lean();
  if (!stage) {
    return NextResponse.json({ error: "Етап не знайдено" }, { status: 404 });
  }

  const championship = await Championship.findById(stage.championshipId).lean();
  if (!championship) {
    return NextResponse.json(
      { error: "Чемпіонат етапу не знайдено" },
      { status: 404 },
    );
  }

  const message = [
    "📢 <b>Додано новий етап!</b>",
    `Чемпіонат: <b>${escapeHtml(championship.name)}</b>`,
    `Етап ${stage.number}: <b>${escapeHtml(stage.name)}</b>`,
    `Дата: <b>${new Date(stage.date).toLocaleDateString("uk-UA")}</b>`,
    "",
    "Реєстрація триває. До зустрічі на трасі! 🏎️",
    "",
    stageLinkLine(String(stage._id)),
  ].join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
