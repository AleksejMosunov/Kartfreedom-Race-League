"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { formatPilotFullName } from "@/lib/utils/pilotName";
import { getPreferredUiChampionshipId } from "@/lib/utils/uiChampionship";
import { useStages } from "@/app/hooks/useStages";
import { useChampionship } from "@/app/hooks/useChampionship";
import { SPONSOR_CONTACT_URL } from "@/lib/config/sponsors";

type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: "solo" | "teams";
  prizes?: { place: string; description: string; }[];
};

export function HomeChampionshipHub({
  active,
  preseasonNews,
}: {
  active: ActiveChampionship[];
  preseasonNews: string | { solo?: string; teams?: string; };
}) {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(
    getPreferredUiChampionshipId(active),
  );
  const { stages } = useStages(selectedChampionshipId || undefined);
  const { standings } = useChampionship(selectedChampionshipId || undefined);
  const selectedChampionship = active.find((c) => c._id === selectedChampionshipId);
  const selectedPreseasonNews =
    typeof preseasonNews === "string"
      ? preseasonNews
      : selectedChampionship?.championshipType === "teams"
        ? (preseasonNews.teams ?? "")
        : (preseasonNews.solo ?? "");

  const nextStage = useMemo(
    () => stages.find((stage) => !stage.isCompleted) ?? null,
    [stages],
  );

  const latestCompleted = useMemo(
    () =>
      [...stages]
        .filter((stage) => stage.isCompleted)
        .sort((a, b) => b.number - a.number)[0] ?? null,
    [stages],
  );

  const leaders = standings.slice(0, 3);
  const prizes = selectedChampionship?.prizes ?? [];
  const hasPrizes = prizes.length > 0;

  if (!active.length) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  return (
    <>
      {active.length > 1 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {active.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => setSelectedChampionshipId(item._id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${selectedChampionshipId === item._id
                ? "bg-red-600 border-red-600 text-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                }`}
            >
              {item.name}
              <span className="ml-2 text-xs opacity-70">
                {item.championshipType === "teams" ? "Endurance" : "Sprint"}
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div className={`grid grid-cols-1 ${hasPrizes ? "md:grid-cols-2 gap-6 md:gap-10" : "gap-0"}`}>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lime-300 mb-2">Наступний етап</p>
            {nextStage ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
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
                    href={`/register?championship=${selectedChampionshipId}`}
                    className="inline-flex rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Зареєструватись
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Календар оновлюється</h2>
                <p className="text-zinc-300 mt-3">
                  Нові дати етапів з&apos;являться найближчим часом. Слідкуйте за оновленнями нижче.
                </p>
              </>
            )}
          </div>

          {hasPrizes ? (
            <div className="border-t border-zinc-800 md:border-t-0 md:border-l md:border-zinc-800 md:pl-8 pt-5 md:pt-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[#ccff00] mb-4">Призовий фонд</p>
              <div className="space-y-2">
                {prizes.map((prize, i) => (
                  <div key={i} className="flex gap-3 items-center rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2.5">
                    <span className="shrink-0 text-black font-black text-xs bg-[#ccff00] px-2 py-1 rounded min-w-[52px] text-center">
                      {prize.place}
                    </span>
                    <p className="text-zinc-200 text-sm leading-snug">{prize.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
            {selectedPreseasonNews ? (
              <div className="rounded-lg border border-zinc-800 px-4 py-3">
                <p className="text-zinc-400 text-xs uppercase tracking-wider">Від організаторів</p>
                <p className="text-zinc-200 mt-1 whitespace-pre-line">{selectedPreseasonNews}</p>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Публічних оголошень наразі немає.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8 overflow-hidden relative">
        <div className="pointer-events-none absolute -top-20 -right-10 w-52 h-52 rounded-full bg-[#ccff00]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#ccff00] mb-2">Партнери та спонсори</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Тут може бути ваш бренд</h2>
              {/* <p className="text-zinc-400 mt-2 max-w-2xl">
                Шукаємо партнерів сезону: банери на трансляціях, згадки в Telegram, інтеграції на сайті та офлайн-брендування на трасі.
              </p> */}
            </div>
            <a
              href={SPONSOR_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-[#ccff00] hover:bg-lime-300 px-4 py-2 text-sm font-black text-black transition-colors"
            >
              Розмістити рекламу
            </a>
          </div>

          {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {["Пакет Генеральний", "Пакет Етапу", "Digital-пакет"].map((name) => (
              <div
                key={name}
                className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 p-4"
              >
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-2">Слот спонсора</p>
                <p className="text-white font-semibold">{name}</p>
                <p className="text-zinc-500 text-sm mt-2">Ваш логотип, CTA та промо-опис можуть бути тут.</p>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-zinc-400 text-sm">Більше деталей та повний залік по чемпіонату</p>
          <p className="text-white font-semibold mt-1">Перейдіть у розділ «Чемпіонат»</p>
        </div>
        <Link
          href="/championship"
          className="inline-flex rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Відкрити чемпіонат
        </Link>
      </div>
    </>
  );
}
