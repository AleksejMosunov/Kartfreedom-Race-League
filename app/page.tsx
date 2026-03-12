import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import { connectToDatabase } from "@/lib/mongodb";
import { Stage } from "@/lib/models/Stage";
import { Pilot } from "@/lib/models/Pilot";
import { Team } from "@/lib/models/Team";
import { calculateChampionshipStandings } from "@/lib/utils/championship";
import { Pilot as IPilotType, Stage as IStageType } from "@/types";
import Link from "next/link";
import { formatPilotFullName } from "@/lib/utils/pilotName";

export const revalidate = 0;

export const metadata = {
  title: "KartFreedom Race League — Таблиця чемпіонату",
  description: "Турнірна таблиця картингового чемпіонату KartFreedom Race League",
};

export default async function Home() {
  const { current, preseasonNews } = await getPublicChampionshipStatus();

  if (!current) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <NoActiveChampionshipBlock news={preseasonNews} />
      </main>
    );
  }

  await connectToDatabase();

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
    Stage.find({ championshipId: current._id }).sort({ number: 1 }).lean(),
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

        return (stages as Array<Record<string, unknown>>).map((stage) => ({
          ...stage,
          results: ((stage.results as Array<Record<string, unknown>>) ?? []).map(
            (result) => {
              const id =
                result.pilotId !== null &&
                  typeof result.pilotId === "object" &&
                  "_id" in (result.pilotId as object)
                  ? String((result.pilotId as { _id: unknown; })._id)
                  : String(result.pilotId);
              const team = teamById.get(id);
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

  const leaders = standings.slice(0, 3);
  const nextStage = (stages as Array<{ _id: string; name: string; number: number; date: Date; isCompleted: boolean; }>).find(
    (stage) => !stage.isCompleted,
  );
  const latestCompleted =
    [...(stages as Array<{ _id: string; name: string; number: number; date: Date; isCompleted: boolean; }>)]
      .filter((stage) => stage.isCompleted)
      .sort((a, b) => b.number - a.number)[0] ?? null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-lime-300 mb-2">Наступний етап</p>
        {nextStage ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Етап {nextStage.number}: {nextStage.name}
            </h2>
            <p className="text-zinc-300 mt-3">
              Дата: {new Date(nextStage.date).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                Зареєструватись
              </Link>
              {/* <Link
                href={`/stages/${nextStage._id}`}
                className="inline-flex rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Деталі етапу
              </Link> */}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Календар оновлюється</h2>
            <p className="text-zinc-300 mt-3">
              Нові дати етапів з&apos;являться найближчим часом. Слідкуйте за оновленнями нижче.
            </p>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-xl font-bold text-white mb-4">Лідери чемпіонату</h3>
          {leaders.length === 0 ? (
            <p className="text-zinc-500">Поки що немає результатів завершених етапів.</p>
          ) : (
            <div className="space-y-2">
              {leaders.map((leader) => (
                <div
                  key={leader.pilot._id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3"
                >
                  <div>
                    <p className="text-zinc-400 text-xs">#{leader.position}</p>
                    <p className="text-white font-semibold">
                      #{leader.pilot.number} {formatPilotFullName(leader.pilot.name, leader.pilot.surname)}
                    </p>
                  </div>
                  <p className="text-white font-black text-xl">{leader.totalPoints}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-xl font-bold text-white mb-4">Останні новини</h3>
          <div className="space-y-3">
            {latestCompleted ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Завершено</p>
                <p className="text-white font-semibold mt-1">
                  Етап {latestCompleted.number}: {latestCompleted.name}
                </p>
              </div>
            ) : null}
            {nextStage ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Анонс</p>
                <p className="text-white font-semibold mt-1">
                  Реєстрація на етап {nextStage.number} вже відкрита.
                </p>
              </div>
            ) : null}
            {preseasonNews ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Від організаторів</p>
                <p className="text-zinc-200 mt-1 whitespace-pre-line">{preseasonNews}</p>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Публічних оголошень наразі немає.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">🏆 Таблиця чемпіонату</h1>
        <p className="text-zinc-400 mt-1">
          Загальний залік · найгірший етап кожного пілота не враховується
        </p>
      </div>
      <ChampionshipTable />
    </main>
  );
}
