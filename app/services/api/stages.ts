import { Stage, StageResult } from "@/types";
import { apiFetch } from "@/app/services/api/request";

const BASE = "/api/stages";

export async function fetchStages(): Promise<Stage[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error("Не вдалося завантажити етапи");
  return res.json();
}

export async function fetchStageById(id: string): Promise<Stage> {
  const res = await apiFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Етап не знайдено");
  return res.json();
}

export async function createStage(
  data: Omit<Stage, "_id" | "isCompleted">,
): Promise<Stage> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Помилка створення етапу");
  return res.json();
}

export async function updateStage(
  id: string,
  data: Partial<Stage>,
): Promise<Stage> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Помилка оновлення етапу");
  return res.json();
}

export async function deleteStage(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Помилка видалення етапу");
}

export async function saveStageResults(
  stageId: string,
  results: Omit<StageResult, "pilot">[],
  raceIndex?: number,
): Promise<Stage> {
  const body: any = { results };
  if (typeof raceIndex === "number") body.raceIndex = Number(raceIndex);
  const res = await apiFetch(`${BASE}/${stageId}/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Помилка збереження результатів");
  return res.json();
}
