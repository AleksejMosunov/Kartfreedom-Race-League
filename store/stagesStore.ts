import { create } from "zustand";
import { Stage, StageResult } from "@/types";

interface StagesState {
  stages: Stage[];
  selectedStage: Stage | null;
  isLoading: boolean;
  error: string | null;
  fetchStages: (championshipId?: string) => Promise<void>;
  fetchStageById: (id: string, championshipId?: string) => Promise<void>;
  addStage: (
    stage: Omit<Stage, "_id" | "results" | "isCompleted">,
  ) => Promise<void>;
  updateStage: (
    id: string,
    data: Partial<Stage>,
    championshipId?: string,
  ) => Promise<void>;
  deleteStage: (id: string, championshipId?: string) => Promise<void>;
  saveStageResults: (
    stageId: string,
    results: Omit<StageResult, "pilot">[],
    championshipId?: string,
  ) => Promise<void>;
  setSelectedStage: (stage: Stage | null) => void;
}

export const useStagesStore = create<StagesState>((set) => ({
  stages: [],
  selectedStage: null,
  isLoading: false,
  error: null,

  fetchStages: async (championshipId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = championshipId
        ? `/api/stages?championship=${encodeURIComponent(championshipId)}`
        : "/api/stages";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Помилка завантаження етапів");
      const data: Stage[] = await res.json();
      set({ stages: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStageById: async (id, championshipId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = championshipId
        ? `/api/stages/${id}?championship=${encodeURIComponent(championshipId)}`
        : `/api/stages/${id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Помилка завантаження етапу");
      const data: Stage = await res.json();
      set({ selectedStage: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  addStage: async (stage) => {
    const res = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stage),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Помилка додавання етапу");
    }
    const created: Stage = await res.json();
    set((state) => ({ stages: [...state.stages, created] }));
  },

  updateStage: async (id, data, championshipId?: string) => {
    const url = championshipId
      ? `/api/stages/${id}?championship=${encodeURIComponent(championshipId)}`
      : `/api/stages/${id}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Помилка оновлення етапу");
    const updated: Stage = await res.json();
    set((state) => ({
      stages: state.stages.map((s) => (s._id === id ? updated : s)),
      selectedStage:
        state.selectedStage?._id === id ? updated : state.selectedStage,
    }));
  },

  deleteStage: async (id, championshipId?: string) => {
    const url = championshipId
      ? `/api/stages/${id}?championship=${encodeURIComponent(championshipId)}`
      : `/api/stages/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("Помилка видалення етапу");
    set((state) => ({ stages: state.stages.filter((s) => s._id !== id) }));
  },

  saveStageResults: async (stageId, results, championshipId?: string) => {
    const url = championshipId
      ? `/api/stages/${stageId}/results?championship=${encodeURIComponent(championshipId)}`
      : `/api/stages/${stageId}/results`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });
    if (!res.ok) throw new Error("Помилка збереження результатів етапу");
    const updated: Stage = await res.json();
    set((state) => ({
      stages: state.stages.map((s) => (s._id === stageId ? updated : s)),
      selectedStage:
        state.selectedStage?._id === stageId ? updated : state.selectedStage,
    }));
  },

  setSelectedStage: (stage) => set({ selectedStage: stage }),
}));
