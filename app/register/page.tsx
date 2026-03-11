"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [number, setNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/pilot-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          number: Number(number),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Не вдалося завершити реєстрацію");
      }

      setName("");
      setSurname("");
      setNumber("");
      setSuccess("Реєстрацію успішно завершено. До зустрічі на етапах!");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Реєстрація пілота</h1>
        <p className="text-zinc-400 mt-1">
          Заповніть форму, щоб самостійно зареєструватися на чемпіонат.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Реєстрація..." : "Зареєструватися"}
            </Button>
            <Link href="/pilots" className="text-zinc-500 hover:text-white text-sm transition-colors">
              Переглянути список пілотів
            </Link>
          </div>
        </form>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        {success && <p className="text-green-400 text-sm mt-4">{success}</p>}
      </div>
    </main>
  );
}
