"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader, Card, Button } from "@/app/components/ui";
import { apiFetch } from "@/app/services/api/request";
import { formatPilotFullName } from "@/lib/utils/pilotName";

export default function AdminStageDetailPage() {
  const params = useParams();
  const stageId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!stageId) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/admin/stages/${stageId}/participants`, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load");
        }
        const body = await res.json();
        if (cancelled) return;
        setData(body);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [stageId]);

  const copyToClipboard = async (key: string, text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedMap((s) => ({ ...s, [key]: true }));
      setTimeout(() => setCopiedMap((s) => ({ ...s, [key]: false })), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin/stages" className="text-zinc-500 hover:text-white text-sm mb-6 block">← Повернутись до етапів</Link>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Список пілотів етапу</h1>
        {data && (
          <>
            <p className="text-zinc-400 mt-1">Учасників: {data.total}</p>
            <p className="text-zinc-400 mt-1">Зареєстрованих на 1 гонку: {data.byRacesCount[1]}</p>
            <p className="text-zinc-400 mt-1">Зареєстрованих на 2 гонки: {data.byRacesCount[2]}</p>
          </>
        )}
      </div>

      {loading && <Loader />}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && data && (
        <div className="space-y-2">
          {data.pilots.map((pilot: any) => (
            <Card key={pilot._id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div>
                  <span className="text-zinc-500 text-sm font-mono mr-2">#{pilot.number}</span>
                  <span className="text-white font-semibold">{formatPilotFullName(pilot.name, pilot.surname)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-4 text-sm text-zinc-300 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-xs">SWS:</span>
                    <span className="text-white font-medium">{pilot.swsId ?? "—"}</span>
                    <button type="button" aria-label="Копіювати SWS" onClick={() => copyToClipboard(`${pilot._id}:sws`, pilot.swsId)} className="ml-2 text-zinc-400 hover:text-white">
                      {copiedMap[`${pilot._id}:sws`] ? <span className="text-green-400 text-xs">Скопійовано</span> : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-xs">Телефон:</span>
                    <span className="text-white font-medium">{pilot.phone ?? "не вказано"}</span>
                    <button type="button" aria-label="Копіювати телефон" onClick={() => copyToClipboard(`${pilot._id}:phone`, pilot.phone)} className="ml-2 text-zinc-400 hover:text-white">
                      {copiedMap[`${pilot._id}:phone`] ? <span className="text-green-400 text-xs">Скопійовано</span> : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-xs">Перегони:</span>
                    <span className="text-white font-medium">{pilot.racesCount ?? 1}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
