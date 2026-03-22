"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { NoActiveClientGate } from "@/app/components/championship/NoActiveClientGate";
import { Loader } from "@/app/components/ui/Loader";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { useStages } from "@/app/hooks/useStages";
import { getPreferredUiChampionshipId, sortSprintFirst } from "@/lib/utils/uiChampionship";
import { Stage } from "@/types";
import { SOCIAL_LINK_DEFAULTS } from "@/lib/socialLinks";

type ChampionshipMode = "sprint" | "sprint-pro";
type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: ChampionshipMode;
};

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const championshipFromUrl = searchParams.get("championship") ?? "";
  const stageFromUrl = searchParams.get("stage") ?? "";
  const {
    active,
    isLoading: championshipsLoading,
    hasLoaded,
  } = useChampionshipsCatalog();
  const activeChampionships = sortSprintFirst(active as ActiveChampionship[]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  // pilot number removed from registration

  const [phone, setPhone] = useState("");
  const [swsId, setSwsId] = useState("");
  const [swsError, setSwsError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [stageId, setStageId] = useState("");
  const [league, setLeague] = useState("");
  const [bothRaces, setBothRaces] = useState(false);
  const [firstRace, setFirstRace] = useState(false);
  const [secondRace, setSecondRace] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedChampionship =
    activeChampionships.find((item) => item._id === selectedChampionshipId) ??
    activeChampionships.find((item) => item.championshipType === "sprint") ??
    activeChampionships[0] ??
    null;
  const championshipMode = selectedChampionship?.championshipType ?? "sprint";
  const modeLoading = (championshipsLoading && !hasLoaded) || (activeChampionships.length > 0 && !selectedChampionshipId);

  const { stages } = useStages(selectedChampionshipId, { enabled: Boolean(selectedChampionshipId) });

  useEffect(() => {
    if (championshipMode === "sprint-pro") setLeague("pro");
    if (championshipMode === "sprint") setLeague("");
  }, [championshipMode]);
  useEffect(() => {
    if (!activeChampionships.length) return;
    const preferred =
      championshipFromUrl && activeChampionships.some((c) => c._id === championshipFromUrl)
        ? championshipFromUrl
        : getPreferredUiChampionshipId(activeChampionships);
    setSelectedChampionshipId((prev) => prev || preferred);
  }, [activeChampionships, championshipFromUrl]);

  // If a stage id is provided in the URL, and stages are loaded for the selected championship,
  // preselect the stage in the select control so the user sees it immediately.
  useEffect(() => {
    if (!stageFromUrl) return;
    if (!stages || stages.length === 0) return;
    const found = stages.find((s: Stage) => s._id === stageFromUrl && !s.isCompleted);
    if (found) setStageId(stageFromUrl);
  }, [stageFromUrl, stages]);



  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    // Teams registration removed; no multi-driver validation required here.

    try {
      setSwsError("");
      setPhoneError("");
      // client-side check: league required for regular sprint registration
      if (championshipMode === "sprint") {
        if (!league) {
          setError("Виберіть лігу пілота");
          setSubmitting(false);
          return;
        }
      }
      // Require selecting a stage when stages are available.
      // Try multiple fallbacks for stage id: React state, native form data, and DOM lookup.
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const formStage = (formData.get("stageId") as string) || "";
      let effectiveStageId = stageId || formStage || "";

      if (!effectiveStageId) {
        const select = (e.currentTarget as HTMLFormElement).querySelector(
          'select[name="stageId"]',
        ) as HTMLSelectElement | null;
        if (select && select.value) effectiveStageId = select.value;
      }

      if (stages && stages.length > 0 && !effectiveStageId) {
        setError("Оберіть етап для реєстрації");
        setSubmitting(false);
        return;
      }
      const payload: Record<string, unknown> = {
        // Teams registration removed — always use individual payload
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim(),
      };
      if (championshipMode === "sprint") (payload as Record<string, unknown>).league = league;
      if (championshipMode === "sprint-pro") (payload as Record<string, unknown>).league = "pro";

      if (swsId && swsId.trim()) (payload as Record<string, unknown>).swsId = swsId.trim();
      // Attach registrations[] instead of legacy top-level per-stage fields.
      if (effectiveStageId) {
        // If user selected 'all', expand to individual registrations for every stage
        if (effectiveStageId === "all") {
          if (championshipMode === "sprint" && !firstRace && !secondRace && !bothRaces) {
            // default to firstRace if none explicitly selected
          }
          const regs = (stages ?? [])
            .filter((s: Stage) => !s.isCompleted)
            .map((s: Stage) => {
              const useFirst = bothRaces ? true : firstRace || (!firstRace && !secondRace);
              const useSecond = bothRaces ? true : secondRace || false;
              // compute raceIds available on this stage
              const raceIds: string[] = [];
              if (s.races && s.races[0] && s.races[0]._id && useFirst) raceIds.push(s.races[0]._id);
              if (s.races && s.races[1] && s.races[1]._id && useSecond) raceIds.push(s.races[1]._id);
              return {
                championshipId: selectedChampionshipId,
                stageId: s._id,
                firstRace: Boolean(useFirst),
                secondRace: Boolean(useSecond),
                racesCount: (useFirst && useSecond) ? 2 : 1,
                raceIds,
              };
            })
            .filter(Boolean as unknown as (v: unknown) => boolean);

          (payload as Record<string, unknown>).championshipId = selectedChampionshipId;
          // set top-level stageId to 'all' so server recognizes optingAllStages
          (payload as Record<string, unknown>).stageId = "all";
          (payload as Record<string, unknown>).registrations = regs;
        } else {
          if (championshipMode === "sprint") {
            if (!firstRace && !secondRace) {
              setError("Оберіть хоча б одну гонку");
              setSubmitting(false);
              return;
            }
          }

          (payload as Record<string, unknown>).championshipId = selectedChampionshipId;
          // include top-level stageId for backwards-compatible server validation
          (payload as Record<string, unknown>).stageId = effectiveStageId;
          // find the selected stage to extract race ids
          const selStage = (stages ?? []).find((s: Stage) => s._id === effectiveStageId);
          const raceIds: string[] = [];
          const useFirst = bothRaces ? true : firstRace || (!firstRace && !secondRace);
          const useSecond = bothRaces ? true : secondRace || false;
          if (selStage) {
            if (selStage.races && selStage.races[0] && selStage.races[0]._id && useFirst) raceIds.push(selStage.races[0]._id);
            if (selStage.races && selStage.races[1] && selStage.races[1]._id && useSecond) raceIds.push(selStage.races[1]._id);
          }

          (payload as Record<string, unknown>).registrations = [
            {
              championshipId: selectedChampionshipId,
              stageId: effectiveStageId,
              firstRace,
              secondRace,
              racesCount: firstRace && secondRace ? 2 : 1,
              raceIds,
            },
          ];
        }
      } else {
        // No stage selected — still include championship context so server can choose current or provided championship
        (payload as Record<string, unknown>).championshipId = selectedChampionshipId;
      }

      const res = await fetch("/api/pilot-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body.error ?? "Не вдалося завершити реєстрацію";
        // Field-specific mapping
        if (res.status === 409) {
          if (msg.toLowerCase().includes("телефон")) {
            setPhoneError(msg);
            setError("");
            setSubmitting(false);
            return;
          }
          if (msg.toLowerCase().includes("sws")) {
            setSwsError(msg);
            setError("");
            setSubmitting(false);
            return;
          }
        }
        throw new Error(msg);
      }

      // Keep user personal data so they can quickly register for another stage.
      setStageId("");
      setBothRaces(false);
      setFirstRace(false);
      setSecondRace(false);
      setSuccess("Реєстрацію успішно завершено. Можете зареєструватися на інший етап.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NoActiveClientGate>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {modeLoading ? (
          <Loader />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white">Реєстрація пілота</h1>
              <p className="text-zinc-400 mt-1">Заповніть форму, щоб самостійно зареєструватися на чемпіонат.</p>
            </div>

            {activeChampionships.length > 1 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {activeChampionships.map((championship) => (
                  <button
                    key={championship._id}
                    type="button"
                    onClick={() => {
                      setSelectedChampionshipId(championship._id);
                      setError("");
                      setSuccess("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${selectedChampionshipId === championship._id
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      }`}
                  >
                    {championship.name}
                    <span className="ml-2 text-xs opacity-70">
                      {championship.championshipType === "sprint-pro" ? "Sprint Pro" : "Sprint"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              {selectedChampionship && (
                <p className="text-zinc-400 text-sm mb-4">
                  Обраний чемпіонат: <span className="text-white">{selectedChampionship.name}</span>
                </p>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <>
                  <input
                    type="text"
                    placeholder="Ім'я *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Прізвище *"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                  {/* Pilot number removed — no longer collected */}
                  <input
                    type="tel"
                    placeholder="Телефон +380XXXXXXXXX *"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      if (!digits) { setPhone(""); return; }
                      let normalized: string;
                      if (digits.startsWith("380")) normalized = "+" + digits.slice(0, 12);
                      else if (digits.startsWith("0")) normalized = "+38" + digits.slice(0, 10);
                      else normalized = "+" + digits.slice(0, 12);
                      setPhone(normalized);
                    }}
                    className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                    inputMode="tel"
                    pattern="\+380\d{9}"
                    title="Тільки українські номери: +380XXXXXXXXX"
                    required
                  />
                  {phoneError && <p className="text-red-400 text-xs mt-2">{phoneError}</p>}
                  <div className="sm:col-span-2">
                    {championshipMode === "sprint" && (
                      <>
                        <label className="text-sm text-zinc-400 block mb-2">Ліга *</label>
                        <select
                          value={league}
                          onChange={(e) => setLeague(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                          required
                        >
                          <option value="">-- оберіть лігу --</option>
                          <option value="pro">Про</option>
                          <option value="newbie">Новачки</option>
                        </select>
                      </>
                    )}

                    <div className="mt-3">
                      <label className="text-sm text-zinc-400 block mb-2">SWS ID</label>
                      <input
                        type="text"
                        placeholder="SWS ID або псевдонім"
                        value={swsId}
                        onChange={(e) => setSwsId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                      {swsError && <p className="text-red-400 text-xs mt-2">{swsError}</p>}
                      <p className="text-zinc-200 text-xs mt-2 ">
                        Якщо ви ще не SWS пілот — зареєструйтесь на сайті SWS.{' '}
                        <a href="https://www.sodiwseries.com/en-gb/become-sws-driver.html" target="_blank" rel="noreferrer" className="text-red-500">
                          Інструкція SWS
                        </a>
                        .
                        <br />
                        Для деталей звертайтесь до організатора: <a href="https://t.me/aleksej_mosunov" className="text-red-500">Telegram</a>.
                      </p>
                    </div>

                    {stages && stages.length > 0 && (
                      <div className="mt-3">
                        <label className="text-sm text-zinc-400 block mb-2">Реєстрація на етап (обов&apos;язково)</label>
                        <select
                          name="stageId"
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                          value={stageId}
                          onChange={(e) => setStageId(e.target.value)}
                        >
                          <option value="">-- оберіть етап --</option>
                          {stages.map((s: Stage) => (
                            <option key={s._id} value={s._id} disabled={s.isCompleted}>
                              {`${s.number} — ${s.name} (${new Date(s.date).toLocaleDateString()})`}
                              {s.isCompleted ? " — (Завершено)" : ""}
                            </option>
                          ))}
                          <option value="all">Реєстрація на всі етапи (без завершених)</option>
                        </select>
                        <p className="text-zinc-500 text-xs mt-2">Опція «Реєстрація на всі етапи» не включає етапи, які вже позначені як завершені.</p>

                        {/* debug info removed */}
                      </div>
                    )}
                    {/* For regular sprint stages: explain that a stage is two classic sprints and allow choosing 1 or 2 races */}
                    {championshipMode === "sprint" && (
                      <div className="mt-4 bg-zinc-800 border border-zinc-700 rounded-md p-3">
                        <p className="text-zinc-200 text-sm font-medium">Інформація про етап</p>
                        <p className="text-zinc-500 text-xs mt-1">
                          Кожен етап складається з 2 гонок на треку KartFreedom.
                          <br />
                          Якщо ви берете участь в обох гонках етапу, діє спеціальна ціна.
                          <br />
                          Перша гонка напрямок стандарт, старт 9-00, вартість 2000 грн
                          <br />
                          Друга гонка напрямок реверс, старт 12-00, вартість 2000 грн
                          <br />
                          Обидві гонки етапу (стандарт + реверс) за спеціальною ціною 3000 грн
                        </p>

                        <div className="mt-3">
                          <label className="text-sm block mb-2 text-zinc-400">Оберіть гонку</label>
                          <select
                            name="raceOption"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                            value={firstRace && secondRace ? "both" : firstRace ? "first" : secondRace ? "second" : ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "first") {
                                setFirstRace(true);
                                setSecondRace(false);
                                setBothRaces(false);
                              } else if (v === "second") {
                                setFirstRace(false);
                                setSecondRace(true);
                                setBothRaces(false);
                              } else if (v === "both") {
                                setFirstRace(true);
                                setSecondRace(true);
                                setBothRaces(true);
                              } else {
                                setFirstRace(false);
                                setSecondRace(false);
                                setBothRaces(false);
                              }
                            }}
                          >
                            <option value="">-- оберіть --</option>
                            <option value="first">Перша гонка (2000грн)</option>
                            <option value="second">Друга гонка (2000 грн)</option>
                            <option value="both">Обидві гонки (спеціальна ціна 3000 грн)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </>

                <div className="sm:col-span-2 flex items-center gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Реєстрація..." : "Зареєструватися"}
                  </Button>
                </div>
              </form>

              {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
              {success && <p className="text-green-400 text-sm mt-4">{success}</p>}
            </div>
          </>
        )}
      </main>
    </NoActiveClientGate>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loader />}>
      <RegisterPageInner />
    </Suspense>
  );
}
