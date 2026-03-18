"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { useChampionshipsCatalog } from "@/app/hooks/useChampionshipsCatalog";
import { apiFetch } from "@/app/services/api/request";

type ChampionshipType = "sprint" | "sprint-pro";

type ActiveChampionship = {
  _id: string;
  name: string;
  championshipType: ChampionshipType;
};

type ImportRow = {
  line: number;
  name: string;
  surname: string;
  number: number;
  phone: string;
};

type PreviewRow = ImportRow & {
  status: "ok" | "conflict";
  reason?: string;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("380") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+38${digits}`;
  return `+${digits}`;
}

function isValidPhone(phone: string): boolean {
  return /^\+380\d{9}$/.test(phone);
}

export default function AdminImportPage() {
  const {
    active,
    isLoading: championshipsLoading,
    hasLoaded,
  } = useChampionshipsCatalog();
  const activeChampionships = active as ActiveChampionship[];
  const [selectedChampionshipIdState, setSelectedChampionshipIdState] = useState("");
  const selectedChampionshipId = useMemo(() => {
    if (
      selectedChampionshipIdState &&
      activeChampionships.some((item) => item._id === selectedChampionshipIdState)
    ) {
      return selectedChampionshipIdState;
    }
    return activeChampionships[0]?._id ?? "";
  }, [activeChampionships, selectedChampionshipIdState]);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selected = useMemo(
    () => activeChampionships.find((item) => item._id === selectedChampionshipId) ?? null,
    [activeChampionships, selectedChampionshipId],
  );

  const parseRows = (): ImportRow[] => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return [];
    }

    const first = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
    const hasHeader =
      first.includes("name") || first.includes("surname") || first.includes("number") || first.includes("phone");

    const rows = (hasHeader ? lines.slice(1) : lines)
      .map((line, idx) => ({
        line: hasHeader ? idx + 2 : idx + 1,
        cols: parseCsvLine(line),
      }))
      .map(({ line, cols }) => {
        const name = (cols[0] ?? "").trim();
        const surname = (cols[1] ?? "").trim();
        const number = Number((cols[2] ?? "").trim());
        const phone = normalizePhone(cols[3] ?? "");
        return { line, name, surname, number, phone };
      });

    return rows;
  };

  const buildPreview = async () => {
    if (!selected) {
      setError("Оберіть чемпіонат");
      return;
    }

    setIsPreviewing(true);
    setError("");
    setSuccess("");
    try {
      const rows = parseRows();
      if (rows.length === 0) {
        setPreview([]);
        setError("CSV порожній");
        return;
      }

      const [pilotsRes, teamsRes] = await Promise.all([
        apiFetch(`/api/pilots?championship=${encodeURIComponent(selected._id)}`, { cache: "no-store" }),
        apiFetch(`/api/teams?championship=${encodeURIComponent(selected._id)}`, { cache: "no-store" }),
      ]);

      const pilots = pilotsRes.ok ? ((await pilotsRes.json()) as Array<{ number?: number; phone?: string; }>) : [];
      const teams = teamsRes.ok ? ((await teamsRes.json()) as Array<{ number?: number; phone?: string; name?: string; }>) : [];

      const existingNumbers = new Set<number>([
        ...pilots.map((p) => Number(p.number)).filter((n) => Number.isInteger(n)),
        ...teams.map((t) => Number(t.number)).filter((n) => Number.isInteger(n)),
      ]);
      const existingPhones = new Set<string>([
        ...pilots.map((p) => String(p.phone ?? "")).filter(Boolean),
        ...teams.map((t) => String(t.phone ?? "")).filter(Boolean),
      ]);

      const seenNumbers = new Set<number>();
      const seenPhones = new Set<string>();

      const prepared: PreviewRow[] = rows.map((row) => {
        if (!row.name || !Number.isInteger(row.number) || row.number < 1 || row.number > 999) {
          return { ...row, status: "conflict", reason: "Некоректні дані: name/number" };
        }
        if (!row.phone || !isValidPhone(row.phone)) {
          return { ...row, status: "conflict", reason: "Некоректний телефон" };
        }

        if (seenNumbers.has(row.number)) {
          return { ...row, status: "conflict", reason: "Дубль номера в CSV" };
        }
        if (seenPhones.has(row.phone)) {
          return { ...row, status: "conflict", reason: "Дубль телефону в CSV" };
        }

        if (existingNumbers.has(row.number)) {
          return { ...row, status: "conflict", reason: "Номер вже існує" };
        }
        if (existingPhones.has(row.phone)) {
          return { ...row, status: "conflict", reason: "Телефон вже існує" };
        }

        if (selected.championshipType === "sprint" && !row.surname) {
          return { ...row, status: "conflict", reason: "Для Sprint потрібні ім'я та прізвище" };
        }

        seenNumbers.add(row.number);
        seenPhones.add(row.phone);
        return { ...row, status: "ok" };
      });

      setPreview(prepared);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const runImport = async () => {
    if (!selected) return;

    const valid = preview.filter((row) => row.status === "ok");
    if (valid.length === 0) {
      setError("Немає валідних рядків для імпорту");
      return;
    }

    setIsImporting(true);
    setError("");
    setSuccess("");
    try {
      let imported = 0;
      const failed: string[] = [];

      for (const row of valid) {
        if (selected.championshipType === "sprint") {
          const res = await apiFetch(`/api/pilots?championship=${encodeURIComponent(selected._id)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: row.name,
              surname: row.surname,
              number: row.number,
              phone: row.phone,
            }),
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string; };
            failed.push(`Рядок ${row.line}: ${body.error ?? "помилка"}`);
            continue;
          }
          imported += 1;
        } else {
          if (row.surname) {
            const res = await apiFetch("/api/pilot-registration", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                championshipId: selected._id,
                isSolo: true,
                name: row.name,
                surname: row.surname,
                number: row.number,
                phone: row.phone,
              }),
            });
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { error?: string; };
              failed.push(`Рядок ${row.line}: ${body.error ?? "помилка"}`);
              continue;
            }
          } else {
            const res = await apiFetch(`/api/teams?championship=${encodeURIComponent(selected._id)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: row.name,
                number: row.number,
                phone: row.phone,
                isSolo: true,
                drivers: [],
              }),
            });
            if (!res.ok) {
              const body = (await res.json().catch(() => ({}))) as { error?: string; };
              failed.push(`Рядок ${row.line}: ${body.error ?? "помилка"}`);
              continue;
            }
          }
          imported += 1;
        }
      }

      setSuccess(`Імпортовано: ${imported}. Помилок: ${failed.length}.`);
      if (failed.length > 0) {
        setError(failed.slice(0, 8).join("\n"));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setPreview([]);
  };

  if (championshipsLoading && !hasLoaded) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-zinc-400">Завантаження…</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-black text-white">Імпорт учасників CSV</h1>
      <p className="text-zinc-400 text-sm">
        Формат CSV: <span className="text-zinc-200">name,surname_or_empty,number,phone</span>
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <label className="text-sm text-zinc-400 block">Чемпіонат</label>
        <select
          value={selectedChampionshipId}
          onChange={(e) => setSelectedChampionshipIdState(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
        >
          {activeChampionships.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name} ({item.championshipType === "sprint-pro" ? "Sprint (Pro)" : "Sprint"})
            </option>
          ))}
        </select>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="text-sm text-zinc-300"
        />

        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setPreview([]);
          }}
          placeholder="name,surname,number,phone"
          className="w-full min-h-44 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
        />

        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="secondary" onClick={buildPreview} disabled={isPreviewing || !selected}>
            {isPreviewing ? "Перевірка..." : "Dry-run перевірка"}
          </Button>
          <Button type="button" onClick={runImport} disabled={isImporting || preview.length === 0}>
            {isImporting ? "Імпорт..." : "Імпортувати валідні"}
          </Button>
        </div>

        {error ? <pre className="text-red-400 text-xs whitespace-pre-wrap">{error}</pre> : null}
        {success ? <p className="text-emerald-400 text-sm">{success}</p> : null}
      </div>

      {preview.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Preview</h2>
            <p className="text-xs text-zinc-400">
              OK: {preview.filter((row) => row.status === "ok").length} / {preview.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Surname/Team</th>
                  <th className="text-left py-2">Number</th>
                  <th className="text-left py-2">Phone</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={`${row.line}-${row.number}-${row.phone}`} className="border-b border-zinc-800/70">
                    <td className="py-2 text-zinc-500">{row.line}</td>
                    <td className="py-2 text-zinc-200">{row.name}</td>
                    <td className="py-2 text-zinc-300">{row.surname || "—"}</td>
                    <td className="py-2 text-zinc-300">{row.number}</td>
                    <td className="py-2 text-zinc-300">{row.phone}</td>
                    <td className="py-2">
                      {row.status === "ok" ? (
                        <span className="text-emerald-400">OK</span>
                      ) : (
                        <span className="text-red-400">{row.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </main>
  );
}
