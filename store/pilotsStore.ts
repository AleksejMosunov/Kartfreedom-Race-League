import { create } from "zustand";
import { Pilot } from "@/types";

interface PilotsState {
  pilots: Pilot[];
  isLoading: boolean;
  error: string | null;
  fetchPilots: (championshipId?: string) => Promise<void>;
  addPilot: (pilot: Omit<Pilot, "_id">) => Promise<void>;
  updatePilot: (id: string, data: Partial<Pilot>) => Promise<void>;
  deletePilot: (id: string) => Promise<void>;
}

export const usePilotsStore = create<PilotsState>((set) => ({
  pilots: [],
  isLoading: false,
  error: null,

  fetchPilots: async (championshipId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = championshipId
        ? `/api/pilots?championship=${encodeURIComponent(championshipId)}`
        : "/api/pilots";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Помилка завантаження пілотів");
      const data: Pilot[] = await res.json();
      set({ pilots: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addPilot: async (pilot) => {
    const res = await fetch("/api/pilots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pilot),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Помилка додавання пілота");
    }
    const created: Pilot = await res.json();
    set((state) => ({ pilots: [...state.pilots, created] }));
  },

  updatePilot: async (id, data) => {
    const res = await fetch(`/api/pilots/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Помилка оновлення пілота");
    const updated: Pilot = await res.json();
    set((state) => ({
      pilots: state.pilots.map((p) => (p._id === id ? updated : p)),
    }));
  },

  deletePilot: async (id) => {
    const res = await fetch(`/api/pilots/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Помилка видалення пілота");
    set((state) => ({ pilots: state.pilots.filter((p) => p._id !== id) }));
  },
}));
