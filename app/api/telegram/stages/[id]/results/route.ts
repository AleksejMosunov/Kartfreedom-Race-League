import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import {
  escapeHtml,
  sendTelegramMessage,
  webAppLinkLine,
} from "@/lib/telegram";

type Params = { params: Promise<{ id: string }> };

type Participant = {
  _id: string;
  name: string;
  surname: string;
  number: number;
};

function participantLabel(participant: Participant) {
  return participant.surname
    ? `#${participant.number} ${participant.name} ${participant.surname}`
    : `#${participant.number} ${participant.name}`;
}

export async function POST(_req: NextRequest, { params }: Params) {
  await connectToDatabase();

  const { id } = await params;
  const stage = await Stage.findById(id).lean();
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

  const participantsRaw =
    championship.championshipType === "teams"
      ? await Team.find({ championshipId: championship._id }).lean()
      : await Pilot.find({ championshipId: championship._id }).lean();

  const participants: Participant[] = participantsRaw.map((item) => ({
    _id: String(item._id),
    name: item.name,
    surname: "surname" in item ? (item.surname ?? "") : "",
    number: item.number,
  }));

  const participantById = new Map(participants.map((p) => [p._id, p]));

  const sorted = [...(stage.results ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const podium = sorted
    .filter((row) => !row.dnf && !row.dns)
    .slice(0, 3)
    .map((row) => {
      const idValue =
        row.pilotId !== null &&
        typeof row.pilotId === "object" &&
        "_id" in (row.pilotId as object)
          ? String((row.pilotId as { _id: unknown })._id)
          : String(row.pilotId);
      const participant = participantById.get(idValue);
      return participant
        ? {
            label: participantLabel(participant),
            points: row.points,
          }
        : {
            label: idValue,
            points: row.points,
          };
    });

  const fastestLapRow = sorted.find((row) => row.bestLap);
  let fastestLapLine = "";
  if (fastestLapRow) {
    const fastestId =
      fastestLapRow.pilotId !== null &&
      typeof fastestLapRow.pilotId === "object" &&
      "_id" in (fastestLapRow.pilotId as object)
        ? String((fastestLapRow.pilotId as { _id: unknown })._id)
        : String(fastestLapRow.pilotId);
    const fastestParticipant = participantById.get(fastestId);
    fastestLapLine = fastestParticipant
      ? `⚡ Best lap: <b>${escapeHtml(participantLabel(fastestParticipant))}</b> (+1 очк.)`
      : "";
  }

  const medals = ["🥇", "🥈", "🥉"];
  const podiumLines = podium.map(
    (entry, idx) =>
      `${medals[idx]} <b>${escapeHtml(entry.label)}</b> — ${entry.points} очк.`,
  );

  const message = [
    `🏁 <b>Результати етапу ${stage.number}</b>`,
    `<b>${escapeHtml(stage.name)}</b>`,
    `Чемпіонат: ${escapeHtml(championship.name)}`,
    "",
    ...podiumLines,
    fastestLapLine,
    "",
    podium[0]
      ? `Вітаємо переможця та призерів! 👏`
      : "Результати опубліковано.",
    "",
    webAppLinkLine(),
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
