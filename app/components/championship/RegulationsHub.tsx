"use client";

import { useEffect, useState } from "react";
import { RegulationsContent } from "@/types";

type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: "solo" | "teams";
};

export function RegulationsHub({
  active,
}: {
  active: ActiveChampionship[];
}) {
  const [selectedChampionshipId, setSelectedChampionshipId] = useState(active[0]?._id ?? "");
  const [content, setContent] = useState<RegulationsContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedChampionshipId) {
      setContent(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/championships/${selectedChampionshipId}/regulations`, {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => ({}))) as RegulationsContent & {
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "Не вдалося завантажити регламент");
        setContent(body);
      } catch (err) {
        setError((err as Error).message);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedChampionshipId]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
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

      {loading ? <p className="text-zinc-400">Завантаження...</p> : null}
      {error ? <p className="text-red-400 mb-6">{error}</p> : null}

      {!loading && content ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">{content.title}</h1>
            <p className="text-zinc-400 mt-2">{content.intro}</p>
          </div>

          <section className="space-y-6 text-zinc-200">
            {content.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <h2 className="text-xl font-bold text-white mb-2">{section.title}</h2>
                <p>{section.content}</p>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
