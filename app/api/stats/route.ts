import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { Championship } from "@/lib/models/Championship";
import { getCurrentChampionship } from "@/lib/championship/current";

type Participant = {
  _id: string;
  name: string;
  surname: string;
  number: number;
};

type StageResultRow = {
  pilotId: string;
  position: number;
  points: number;
  dnf?: boolean;
  dns?: boolean;
  bestLap?: boolean;
};

type StageRow = {
  _id: string;
  number: number;
  name: string;
  isCompleted: boolean;
  results: StageResultRow[];
};

function participantLabel(p: Participant) {
  return p.surname ? `${p.name} ${p.surname}`.trim() : p.name;
}

function calcStdDev(values: number[]) {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - avg) * (v - avg), 0) / values.length;
  return Math.sqrt(variance);
}

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const championshipId = req.nextUrl.searchParams.get("championship");
  const current = championshipId
    ? await Championship.findById(championshipId).lean()
    : await getCurrentChampionship();

  if (!current) {
    return NextResponse.json({
      championshipType: "solo",
      participants: [],
      stageLabels: [],
    });
  }

  const [participantsRaw, stagesRaw] = await Promise.all([
    current.championshipType === "teams"
      ? Team.find({ championshipId: current._id })
          .sort({ number: 1, name: 1 })
          .lean()
          .then((teams) =>
            teams.map((team) => ({
              _id: String(team._id),
              name: team.name,
              surname: "",
              number: team.number,
            })),
          )
      : Pilot.find({ championshipId: current._id })
          .sort({ number: 1 })
          .lean()
          .then((pilots) =>
            pilots.map((pilot) => ({
              _id: String(pilot._id),
              name: pilot.name,
              surname: pilot.surname,
              number: pilot.number,
            })),
          ),
    Stage.find({ championshipId: current._id }).sort({ number: 1 }).lean(),
  ]);

  const participants = participantsRaw as Participant[];
  const completedStages = (stagesRaw as unknown as StageRow[]).filter(
    (stage) => stage.isCompleted,
  );

  const stageLabels = completedStages.map((stage) => ({
    id: String(stage._id),
    number: stage.number,
    name: stage.name,
  }));

  const participantStats = participants.map((participant) => {
    let cumulative = 0;
    const progress: Array<{
      stageId: string;
      stageNumber: number;
      points: number;
      cumulativePoints: number;
    }> = [];
    const heatmap: Array<{
      stageId: string;
      stageNumber: number;
      points: number;
      position: number | null;
      status: "fin" | "dnf" | "dns" | "none";
    }> = [];
    const positions: number[] = [];
    let fastestLaps = 0;

    for (const stage of completedStages) {
      const result = stage.results.find(
        (row) => String(row.pilotId) === participant._id,
      );
      const pts = result?.points ?? 0;
      cumulative += pts;

      if (result?.position && !result.dnf && !result.dns) {
        positions.push(result.position);
      }
      if (result?.bestLap) {
        fastestLaps += 1;
      }

      progress.push({
        stageId: String(stage._id),
        stageNumber: stage.number,
        points: pts,
        cumulativePoints: cumulative,
      });

      heatmap.push({
        stageId: String(stage._id),
        stageNumber: stage.number,
        points: pts,
        position: result?.position ?? null,
        status: result
          ? result.dns
            ? "dns"
            : result.dnf
              ? "dnf"
              : "fin"
          : "none",
      });
    }

    const averagePosition =
      positions.length > 0
        ? Number(
            (
              positions.reduce((sum, pos) => sum + pos, 0) / positions.length
            ).toFixed(2),
          )
        : null;

    const stability =
      positions.length > 1 ? Number(calcStdDev(positions).toFixed(2)) : null;

    return {
      participantId: participant._id,
      participantNumber: participant.number,
      participantName: participantLabel(participant),
      totalPoints: cumulative,
      averagePosition,
      stability,
      fastestLaps,
      progress,
      heatmap,
    };
  });

  return NextResponse.json({
    championshipType: current.championshipType,
    participants: participantStats,
    stageLabels,
  });
}
