import { Pilot } from "@/types";
import { apiFetch } from "@/app/services/api/request";

const BASE = "/api/pilots";

export async function fetchPilots(): Promise<Pilot[]> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error("Не вдалося завантажити пілотів");
  return res.json();
}

export async function fetchPilotById(id: string): Promise<Pilot> {
  const res = await apiFetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Пілота не знайдено");
  return res.json();
}

export async function createPilot(data: Omit<Pilot, "_id">): Promise<Pilot> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Помилка створення пілота");
  return res.json();
}

export async function updatePilot(
  id: string,
  data: Partial<Pilot>,
): Promise<Pilot> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Помилка оновлення пілота");
  return res.json();
}

export async function deletePilot(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Помилка видалення пілота");
}
