import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Championship } from "@/lib/models/Championship";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import {
  escapeHtml,
  sendTelegramMessage,
  stageResultsLinkLine,
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

  // Combine results across races: sum points per participant and pick best position as tiebreaker
  const allResults = ((stage as any).races ?? []).flatMap(
    (r: any) => r.results ?? [],
  );
  const aggregated = new Map<
    string,
    {
      label: string;
      points: number;
      bestPosition: number;
      dnf: boolean;
      dns: boolean;
    }
  >();
  for (const row of allResults) {
    const idValue =
      row.pilotId !== null &&
      typeof row.pilotId === "object" &&
      "_id" in (row.pilotId as object)
        ? String((row.pilotId as { _id: unknown })._id)
        : String(row.pilotId);
    const participant = participantById.get(idValue);
    const label = participant ? participantLabel(participant) : idValue;
    const current = aggregated.get(idValue) ?? {
      label,
      points: 0,
      bestPosition: Infinity,
      dnf: false,
      dns: false,
    };
    current.points += row.points ?? 0;
    const pos = typeof row.position === "number" ? row.position : Infinity;
    if (pos < current.bestPosition) current.bestPosition = pos;
    current.dnf = current.dnf || Boolean(row.dnf);
    current.dns = current.dns || Boolean(row.dns);
    aggregated.set(idValue, current);
  }

  const podium = [...aggregated.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .filter((p) => !p.dnf && !p.dns)
    .sort((a, b) => b.points - a.points || a.bestPosition - b.bestPosition)
    .slice(0, 3)
    .map((p) => ({ label: p.label, points: p.points }));

  const fastestLapRow = allResults.find((row: any) => row.bestLap);
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
    stageResultsLinkLine(String(stage._id), String(championship._id)),
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
