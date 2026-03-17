import { create } from "zustand";
import { Pilot } from "@/types";
import { apiFetch } from "@/app/services/api/request";

interface PilotsState {
  pilots: Pilot[];
  isLoading: boolean;
  error: string | null;
  fetchPilots: (championshipId?: string) => Promise<void>;
  addPilot: (pilot: Omit<Pilot, "_id">) => Promise<void>;
  updatePilot: (id: string, data: Partial<Pilot>) => Promise<void>;
  deletePilot: (id: string) => Promise<void>;
}

const _pilotsInflight = new Map<string, Promise<void>>();

export const usePilotsStore = create<PilotsState>((set) => ({
  pilots: [],
  isLoading: false,
  error: null,

  fetchPilots: async (championshipId?: string): Promise<void> => {
    const key = championshipId ?? "";
    const inflight = _pilotsInflight.get(key);
    if (inflight) return inflight;
    const promise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const url = championshipId
          ? `/api/pilots?championship=${encodeURIComponent(championshipId)}`
          : "/api/pilots";
        const res = await apiFetch(url);
        if (!res.ok) throw new Error("Помилка завантаження пілотів");
        const data: Pilot[] = await res.json();
        // ensure league exists for solo pilots; fallback to 'newbie' when missing
        const normalized = data.map((p) => ({
          ...p,
          league: (p as Pilot).league
            ? (p as Pilot).league
            : ("newbie" as "pro" | "newbie"),
        }));
        set({ pilots: normalized });
      } catch (e) {
        set({ error: (e as Error).message });
      } finally {
        set({ isLoading: false });
        _pilotsInflight.delete(key);
      }
    })();
    _pilotsInflight.set(key, promise);
    return promise;
  },

  addPilot: async (pilot) => {
    const res = await apiFetch("/api/pilots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pilot),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Помилка додавання пілота");
    }
    const created: Pilot = await res.json();
    const normalizedCreated = {
      ...created,
      league: created.league ?? ("newbie" as "pro" | "newbie"),
    };
    set((state) => ({ pilots: [...state.pilots, normalizedCreated] }));
  },

  updatePilot: async (id, data) => {
    const res = await apiFetch(`/api/pilots/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Помилка оновлення пілота");
    const updated: Pilot = await res.json();
    const normalizedUpdated = {
      ...updated,
      league: updated.league ?? ("newbie" as "pro" | "newbie"),
    };
    set((state) => ({
      pilots: state.pilots.map((p) => (p._id === id ? normalizedUpdated : p)),
    }));
  },

  deletePilot: async (id) => {
    const res = await apiFetch(`/api/pilots/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Помилка видалення пілота");
    set((state) => ({ pilots: state.pilots.filter((p) => p._id !== id) }));
  },
}));
