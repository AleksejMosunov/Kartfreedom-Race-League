"use client";

import { useEffect, useMemo, useState } from "react";
import { usePilots } from "@/app/hooks/usePilots";
import { Loader } from "@/app/components/ui/Loader";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";
import { BallastRule, PilotBallastSummary } from "@/types";

function formatKg(kg: number) {
  return `${kg.toLocaleString("uk-UA", { minimumFractionDigits: Number.isInteger(kg) ? 0 : 1, maximumFractionDigits: 1 })} кг`;
}

export default function AdminPilotsPage() {
  const { pilots, isLoading, error, deletePilot } = usePilots();
  const [rules, setRules] = useState<BallastRule[]>([]);
  const [ballastByPilot, setBallastByPilot] = useState<Record<string, PilotBallastSummary>>({});
  const [selectedPilotId, setSelectedPilotId] = useState("");
  const [manualKg, setManualKg] = useState(0);
  const [manualReason, setManualReason] = useState("");
  const [ballastError, setBallastError] = useState("");
  const [ballastSuccess, setBallastSuccess] = useState("");
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);

  const manualEntries = useMemo(
    () => Object.values(ballastByPilot).flatMap((summary) => summary.manualEntries),
    [ballastByPilot],
  );

  useEffect(() => {
    const loadBallast = async () => {
      try {
        const res = await fetch("/api/ballast");
        if (!res.ok) throw new Error("Не вдалося завантажити доваження");
        const data = (await res.json()) as {
          rules?: BallastRule[];
          summaries?: PilotBallastSummary[];
        };
        setRules(data.rules ?? []);
        const nextMap = (data.summaries ?? []).reduce<Record<string, PilotBallastSummary>>(
          (acc, row) => {
            acc[row.pilotId] = row;
            return acc;
          },
          {},
        );
        setBallastByPilot(nextMap);
      } catch (err) {
        setBallastError((err as Error).message);
      }
    };

    void loadBallast();
  }, []);

  const refreshBallast = async () => {
    const res = await fetch("/api/ballast");
    if (!res.ok) throw new Error("Не вдалося оновити дані доваження");
    const data = (await res.json()) as {
      rules?: BallastRule[];
      summaries?: PilotBallastSummary[];
    };
    setRules(data.rules ?? []);
    const nextMap = (data.summaries ?? []).reduce<Record<string, PilotBallastSummary>>(
      (acc, row) => {
        acc[row.pilotId] = row;
        return acc;
      },
      {},
    );
    setBallastByPilot(nextMap);
  };

  const addRule = () => {
    setRules((prev) => [...prev, { position: (prev.at(-1)?.position ?? 0) + 1, kg: 0 }]);
  };

  const updateRule = (index: number, field: keyof BallastRule, value: number) => {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)));
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRules = async () => {
    setBallastError("");
    setBallastSuccess("");
    if (!rules.length) {
      setBallastError("Додайте хоча б одне місце для автодоваження");
      return;
    }

    setIsSavingRules(true);
    try {
      const payload = rules.map((rule) => ({
        position: Math.max(1, Math.floor(Number(rule.position))),
        kg: Number(rule.kg),
      }));
      const res = await fetch("/api/ballast/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: payload }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; };
        throw new Error(body.error ?? "Не вдалося зберегти правила доваження");
      }
      await refreshBallast();
      setBallastSuccess("Правила автодоваження оновлено");
    } catch (err) {
      setBallastError((err as Error).message);
    } finally {
      setIsSavingRules(false);
    }
  };

  const addManualAdjustment = async () => {
    setBallastError("");
    setBallastSuccess("");
    if (!selectedPilotId || !manualReason.trim()) {
      setBallastError("Оберіть пілота, значення кг та вкажіть причину");
      return;
    }

    setIsSavingManual(true);
    try {
      const res = await fetch("/api/ballast/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pilotId: selectedPilotId,
          kg: Number(manualKg),
          reason: manualReason.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; };
        throw new Error(body.error ?? "Не вдалося додати ручне доваження");
      }
      setManualKg(0);
      setManualReason("");
      await refreshBallast();
      setBallastSuccess("Ручне доваження додано");
    } catch (err) {
      setBallastError((err as Error).message);
    } finally {
      setIsSavingManual(false);
    }
  };

  const deleteManualAdjustment = async (id: string) => {
    setBallastError("");
    setBallastSuccess("");
    try {
      const res = await fetch(`/api/ballast/adjustments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не вдалося видалити ручне доваження");
      await refreshBallast();
      setBallastSuccess("Ручне доваження видалено");
    } catch (err) {
      setBallastError((err as Error).message);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-zinc-500 hover:text-white text-sm mb-6 block transition-colors">
        ← Адмін-панель
      </Link>
      <h1 className="text-3xl font-black text-white mb-8">Пілоти</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-2">Публічна реєстрація активна</h2>
        <p className="text-sm text-zinc-400">
          Нові пілоти реєструються самостійно через сторінку
          {" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 underline">
            /register
          </Link>
          .
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Автодоваження за місце</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addRule}>
            Додати місце
          </Button>
        </div>

        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={`rule-${index}`} className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={rule.position}
                onChange={(e) => updateRule(index, "position", Number(e.target.value) || 1)}
                className="w-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              />
              <span className="text-zinc-400 text-sm">місце</span>
              <input
                type="number"
                step={0.1}
                value={rule.kg}
                onChange={(e) => updateRule(index, "kg", Number(e.target.value) || 0)}
                className="w-24 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              />
              <span className="text-zinc-400 text-sm">кг</span>
              <Button type="button" variant="danger" size="sm" onClick={() => removeRule(index)}>
                Видалити
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" onClick={saveRules} disabled={isSavingRules}>
          {isSavingRules ? "Збереження..." : "Зберегти правила"}
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 space-y-4">
        <h2 className="text-lg font-bold text-white">Ручне доваження</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <select
            value={selectedPilotId}
            onChange={(e) => setSelectedPilotId(e.target.value)}
            className="sm:col-span-2 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="">Оберіть пілота</option>
            {pilots.map((pilot) => (
              <option key={pilot._id} value={pilot._id}>
                #{pilot.number} {pilot.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step={0.1}
            value={manualKg}
            onChange={(e) => setManualKg(Number(e.target.value) || 0)}
            className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
            placeholder="кг"
          />
          <Button type="button" onClick={addManualAdjustment} disabled={isSavingManual}>
            {isSavingManual ? "Додавання..." : "Додати"}
          </Button>
        </div>
        <input
          type="text"
          value={manualReason}
          onChange={(e) => setManualReason(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
          placeholder="Причина ручного доваження"
        />

        {manualEntries.length > 0 && (
          <div className="space-y-2">
            {manualEntries.map((entry) => {
              const pilot = pilots.find((p) => p._id === entry.pilotId);
              return (
                <div key={entry._id} className="flex items-center justify-between gap-3 bg-zinc-800/60 rounded-md px-3 py-2">
                  <div className="text-sm text-zinc-200">
                    #{pilot?.number ?? "?"} {pilot?.name ?? "Пілот"}: {entry.reason}
                    <span className="ml-2 text-zinc-400">({entry.kg > 0 ? "+" : ""}{formatKg(entry.kg)})</span>
                  </div>
                  <Button type="button" variant="danger" size="sm" onClick={() => deleteManualAdjustment(entry._id)}>
                    Видалити
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ballastError && <p className="text-red-400 mb-4 text-sm">{ballastError}</p>}
      {ballastSuccess && <p className="text-emerald-400 mb-4 text-sm">{ballastSuccess}</p>}

      {isLoading && <Loader />}
      {error && <p className="text-red-400">{error}</p>}
      <div className="space-y-2">
        {pilots.map((pilot) => (
          <div
            key={pilot._id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-mono text-sm w-8">#{pilot.number}</span>
              <span className="font-semibold text-white">{pilot.name}</span>
              <span className="text-zinc-400 text-sm">
                {formatKg(ballastByPilot[pilot._id]?.totalKg ?? 0)}
              </span>
            </div>
            <Button variant="danger" size="sm" onClick={() => deletePilot(pilot._id)}>
              Видалити
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
