import { useEffect } from "react";
import { useStagesStore } from "@/store/stagesStore";

interface UseStagesOptions {
  enabled?: boolean;
}

export function useStages(championshipId?: string, options?: UseStagesOptions) {
  const {
    stages,
    isLoading,
    error,
    fetchStages,
    addStage,
    updateStage,
    deleteStage,
  } = useStagesStore();

  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    fetchStages(championshipId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championshipId, enabled]);

  return {
    stages,
    isLoading,
    error,
    addStage,
    updateStage: (id: string, data: Partial<import("@/types").Stage>) =>
      updateStage(id, data, championshipId),
    deleteStage: (id: string) => deleteStage(id, championshipId),
    refresh: () => fetchStages(championshipId),
  };
}

export function useStage(id: string, championshipId?: string) {
  const {
    selectedStage,
    isLoading,
    error,
    fetchStageById,
    saveStageResults,
    setSelectedStage,
  } = useStagesStore();

  useEffect(() => {
    if (id) fetchStageById(id, championshipId);
    return () => setSelectedStage(null);
  }, [id, championshipId, fetchStageById, setSelectedStage]);

  return {
    stage: selectedStage,
    isLoading,
    error,
    saveStageResults: (
      stageId: string,
      results: Omit<import("@/types").StageResult, "pilot">[],
    ) => saveStageResults(stageId, results, championshipId),
  };
}
