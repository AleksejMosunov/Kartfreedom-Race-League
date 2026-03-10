import { Stage, StageResult } from "@/types";

const BASE = "/api/stages";

export async function fetchStages(): Promise<Stage[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error("Не удалось загрузить этапы");
  return res.json();
}

export async function fetchStageById(id: string): Promise<Stage> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Этап не найден");
  return res.json();
}

export async function createStage(
  data: Omit<Stage, "_id" | "results" | "isCompleted">,
): Promise<Stage> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка создания этапа");
  return res.json();
}

export async function updateStage(
  id: string,
  data: Partial<Stage>,
): Promise<Stage> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка обновления этапа");
  return res.json();
}

export async function deleteStage(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Ошибка удаления этапа");
}

export async function saveStageResults(
  stageId: string,
  results: Omit<StageResult, "pilot">[],
): Promise<Stage> {
  const res = await fetch(`${BASE}/${stageId}/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  });
  if (!res.ok) throw new Error("Ошибка сохранения результатов");
  return res.json();
}
