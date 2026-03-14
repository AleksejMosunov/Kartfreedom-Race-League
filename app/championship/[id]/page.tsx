"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChampionshipTable } from "@/app/components/championship/ChampionshipTable";
import { Loader } from "@/app/components/ui/Loader";

type ChampionshipType = "solo" | "teams";

type ChampionshipPayload = {
  championship?: {
    _id: string;
    name: string;
    championshipType: ChampionshipType;
    status?: "active" | "archived";
  };
};

export default function ChampionshipByIdPage({
  params,
}: {
  params: Promise<{ id: string; }>;
}) {
  const { id } = use(params);
  const [name, setName] = useState("");
  const [championshipType, setChampionshipType] =
    useState<ChampionshipType>("solo");
  const [status, setStatus] = useState<"active" | "archived" | "unknown">(
    "unknown",
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/championships/${id}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Failed");

        const payload = (await res.json()) as ChampionshipPayload;
        const championship = payload.championship;
        if (!championship) {
          setNotFound(true);
          return;
        }

        setName(championship.name);
        setChampionshipType(
          championship.championshipType === "teams" ? "teams" : "solo",
        );
        setStatus(championship.status ?? "unknown");
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Loader />
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-400">Чемпіонат не знайдено.</p>
        <Link href="/championship" className="text-red-500 underline mt-4 block">
          ← До таблиці чемпіонату
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{name}</h1>
        <p className="text-zinc-400 mt-1">
          {championshipType === "teams" ? "Endurance" : "Sprint"}
          {status !== "unknown" ? ` · ${status === "archived" ? "завершено" : "активний"}` : ""}
        </p>
      </div>

      <ChampionshipTable
        championshipId={id}
        championshipType={championshipType}
      />
    </main>
  );
}
