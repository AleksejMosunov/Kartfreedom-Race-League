import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Championship } from "@/lib/models/Championship";
import {
  escapeHtml,
  registrationLinkLine,
  // registrationLinkLine,
  sendTelegramMessage,
} from "@/lib/telegram";
// IStage type not needed; keep code simpler

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

  // const swsLinksRaw = Array.isArray((stage as IStage).swsLinks)
  //   ? (stage as IStage).swsLinks
  //   : [];
  // const swsLinks = swsLinksRaw.filter(
  //   (s: unknown) => typeof s === "string" && String(s).trim() !== "",
  // );

  const base = [
    "🏎️ <b>Реєстрація відкрита!</b>",
    `Чемпіонат: <b>${escapeHtml(championship.name)}</b>`,
    `Етап ${stage.number}: <b>${escapeHtml(stage.name)}</b>`,
    `Дата: <b>${new Date(stage.date).toLocaleDateString("uk-UA")}</b>`,
    "",
    "Встигни зайняти своє місце на старті ! 🔥",
    "",
    registrationLinkLine(String(stage.championshipId), String(stage._id)),
  ];

  // const swsLines = swsLinks.length
  //   ? [
  //       "",
  //       "🔗 Посилання SWS:",
  //       ...swsLinks.map(
  //         (l: string) => `🔗 <a href="${escapeHtml(l)}">${escapeHtml(l)}</a>`,
  //       ),
  //     ]
  //   : [];

  // const message = [...base, ...swsLines].join("\n");
  const message = [...base].join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
