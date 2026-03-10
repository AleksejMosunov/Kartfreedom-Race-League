import { create } from "zustand";
import { Stage, StageResult } from "@/types";

interface StagesState {
  stages: Stage[];
  selectedStage: Stage | null;
  isLoading: boolean;
  error: string | null;
  fetchStages: () => Promise<void>;
  fetchStageById: (id: string) => Promise<void>;
  addStage: (
    stage: Omit<Stage, "_id" | "results" | "isCompleted">,
  ) => Promise<void>;
  updateStage: (id: string, data: Partial<Stage>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  saveStageResults: (
    stageId: string,
    results: Omit<StageResult, "pilot">[],
  ) => Promise<void>;
  setSelectedStage: (stage: Stage | null) => void;
}

export const useStagesStore = create<StagesState>((set) => ({
  stages: [],
  selectedStage: null,
  isLoading: false,
  error: null,

  fetchStages: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/stages");
      if (!res.ok) throw new Error("Ошибка загрузки этапов");
      const data: Stage[] = await res.json();
      set({ stages: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStageById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/stages/${id}`);
      if (!res.ok) throw new Error("Ошибка загрузки этапа");
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
      throw new Error(body.error ?? "Ошибка добавления этапа");
    }
    const created: Stage = await res.json();
    set((state) => ({ stages: [...state.stages, created] }));
  },

  updateStage: async (id, data) => {
    const res = await fetch(`/api/stages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка обновления этапа");
    const updated: Stage = await res.json();
    set((state) => ({
      stages: state.stages.map((s) => (s._id === id ? updated : s)),
      selectedStage:
        state.selectedStage?._id === id ? updated : state.selectedStage,
    }));
  },

  deleteStage: async (id) => {
    const res = await fetch(`/api/stages/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Ошибка удаления этапа");
    set((state) => ({ stages: state.stages.filter((s) => s._id !== id) }));
  },

  saveStageResults: async (stageId, results) => {
    const res = await fetch(`/api/stages/${stageId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });
    if (!res.ok) throw new Error("Ошибка сохранения результатов этапа");
    const updated: Stage = await res.json();
    set((state) => ({
      stages: state.stages.map((s) => (s._id === stageId ? updated : s)),
      selectedStage:
        state.selectedStage?._id === stageId ? updated : state.selectedStage,
    }));
  },

  setSelectedStage: (stage) => set({ selectedStage: stage }),
}));
