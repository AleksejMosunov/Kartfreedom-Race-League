"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { NoActiveClientGate } from "@/app/components/championship/NoActiveClientGate";
import { Loader } from "@/app/components/ui/Loader";
import { useEffect } from "react";

type ChampionshipMode = "solo" | "teams";
type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: ChampionshipMode;
};

export default function RegisterPage() {
  const [activeChampionships, setActiveChampionships] = useState<ActiveChampionship[]>([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState("");
  const [modeLoading, setModeLoading] = useState(true);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [number, setNumber] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedChampionship =
    activeChampionships.find((item) => item._id === selectedChampionshipId) ??
    activeChampionships[0] ??
    null;
  const championshipMode = selectedChampionship?.championshipType ?? "solo";

  useEffect(() => {
    const loadChampionshipMode = async () => {
      try {
        const res = await fetch("/api/championships", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          active?: ActiveChampionship[];
        };
        const championships = data.active ?? [];
        setActiveChampionships(championships);
        setSelectedChampionshipId(championships[0]?._id ?? "");
      } finally {
        setModeLoading(false);
      }
    };
    void loadChampionshipMode();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/pilot-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          championshipMode === "teams"
            ? {
              championshipId: selectedChampionshipId,
              teamName: teamName.trim(),
              number: Number(teamNumber),
              phone: phone.trim(),
            }
            : {
              championshipId: selectedChampionshipId,
              name: name.trim(),
              surname: surname.trim(),
              number: Number(number),
              phone: phone.trim(),
            },
        ),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не вдалося завершити реєстрацію");
      }

      if (championshipMode === "teams") {
        setTeamName("");
        setTeamNumber("");
        setPhone("");
        setSuccess("Команду успішно зареєстровано.");
      } else {
        setName("");
        setSurname("");
        setNumber("");
        setPhone("");
        setSuccess("Реєстрацію успішно завершено. До зустрічі на етапах!");
      }
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
              <h1 className="text-3xl font-black text-white">
                {championshipMode === "teams" ? "Реєстрація команди" : "Реєстрація пілота"}
              </h1>
              <p className="text-zinc-400 mt-1">
                {championshipMode === "teams"
                  ? "Заповніть форму, щоб зареєструвати команду на чемпіонат."
                  : "Заповніть форму, щоб самостійно зареєструватися на чемпіонат."}
              </p>
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
                      {championship.championshipType === "teams" ? "Endurance" : "Sprint"}
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
                {championshipMode === "teams" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Назва команди *"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      minLength={2}
                      maxLength={60}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Номер команди *"
                      value={teamNumber}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setTeamNumber(onlyDigits);
                      }}
                      className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      inputMode="numeric"
                      pattern="\d{1,3}"
                      maxLength={3}
                      title="Введіть номер від 1 до 999"
                      required
                    />
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
                      className="sm:col-span-2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      inputMode="tel"
                      pattern="\+380\d{9}"
                      title="Тільки українські номери: +380XXXXXXXXX"
                      required
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Ім'я *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      pattern="[A-Za-zА-Яа-яІіЇїЄєҐґ'’ -]+"
                      title="Лише літери, пробіл, дефіс або апостроф"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Прізвище *"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      pattern="[A-Za-zА-Яа-яІіЇїЄєҐґ'’ -]+"
                      title="Лише літери, пробіл, дефіс або апостроф"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Номер *"
                      value={number}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setNumber(onlyDigits);
                      }}
                      className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      inputMode="numeric"
                      pattern="\d{1,3}"
                      maxLength={3}
                      title="Введіть номер від 1 до 999"
                      required
                    />
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
                  </>
                )}

                <div className="sm:col-span-2 flex items-center gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Реєстрація..." : "Зареєструватися"}
                  </Button>
                  {championshipMode === "solo" && (
                    <Link href="/pilots" className="text-zinc-500 hover:text-white text-sm transition-colors">
                      Переглянути список пілотів
                    </Link>
                  )}
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
