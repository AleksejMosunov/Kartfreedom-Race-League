import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { Team } from "@/lib/models/Team";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";
import { getCurrentChampionship } from "@/lib/championship/current";

export async function GET() {
  await connectToDatabase();
  const current = await getCurrentChampionship();
  if (!current) {
    return NextResponse.json([]);
  }

  const [participants, stages] = await Promise.all([
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
      : Pilot.find({ championshipId: current._id }).sort({ number: 1 }).lean(),
    current.championshipType === "teams"
      ? Stage.find()
          .where("championshipId")
          .equals(current._id)
          .sort({ number: 1 })
          .lean()
      : Stage.find()
          .where("championshipId")
          .equals(current._id)
          .populate("results.pilotId", "name surname number team avatar")
          .sort({ number: 1 })
          .lean(),
  ]);

  const mappedStages =
    current.championshipType === "teams"
      ? (() => {
          const teamById = new Map(
            (
              participants as Array<{
                _id: string;
                name: string;
                number: number;
              }>
            ).map((team) => [String(team._id), team]),
          );

          return stages.map((stage) => ({
            ...stage,
            results: (stage.results ?? []).map(
              (result: Record<string, unknown>) => {
                const resultId =
                  result.pilotId !== null &&
                  typeof result.pilotId === "object" &&
                  "_id" in (result.pilotId as object)
                    ? String((result.pilotId as { _id: unknown })._id)
                    : String(result.pilotId);
                const team = teamById.get(resultId);
                if (!team) return result;
                return {
                  ...result,
                  pilot: {
                    _id: team._id,
                    name: team.name,
                    surname: "",
                    number: team.number,
                  },
                };
              },
            ),
          }));
        })()
      : stages;

  const standings = calculateChampionshipStandings(
    participants as unknown as IPilotType[],
    mappedStages as unknown as IStageType[],
  );

  const completedStages = (mappedStages as unknown as IStageType[])
    .filter((stage) => stage.isCompleted)
    .sort((a, b) => a.number - b.number);

  if (completedStages.length > 1) {
    const previousStages = completedStages.slice(0, -1);
    const previousStandings = calculateChampionshipStandings(
      participants as unknown as IPilotType[],
      previousStages,
    );
    const previousPositionById = new Map(
      previousStandings.map((row) => [String(row.pilot._id), row.position]),
    );

    standings.forEach((row) => {
      const previousPosition = previousPositionById.get(String(row.pilot._id));
      row.positionDelta =
        typeof previousPosition === "number"
          ? previousPosition - row.position
          : 0;
    });
  }

  return NextResponse.json(standings);
}
