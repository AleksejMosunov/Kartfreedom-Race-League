import { useEffect } from "react";
import { useStagesStore } from "@/store/stagesStore";

export function useStages() {
  const {
    stages,
    isLoading,
    error,
    fetchStages,
    addStage,
    updateStage,
    deleteStage,
  } = useStagesStore();

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  return {
    stages,
    isLoading,
    error,
    addStage,
    updateStage,
    deleteStage,
    refresh: fetchStages,
  };
}

export function useStage(id: string) {
  const {
    selectedStage,
    isLoading,
    error,
    fetchStageById,
    saveStageResults,
    setSelectedStage,
  } = useStagesStore();

  useEffect(() => {
    if (id) fetchStageById(id);
    return () => setSelectedStage(null);
  }, [id, fetchStageById, setSelectedStage]);

  return { stage: selectedStage, isLoading, error, saveStageResults };
}
