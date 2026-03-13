import { useEffect } from "react";
import { usePilotsStore } from "@/store/pilotsStore";

export function usePilots(championshipId?: string) {
  const {
    pilots,
    isLoading,
    error,
    fetchPilots,
    addPilot,
    updatePilot,
    deletePilot,
  } = usePilotsStore();

  useEffect(() => {
    fetchPilots(championshipId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championshipId]);

  return {
    pilots,
    isLoading,
    error,
    addPilot,
    updatePilot,
    deletePilot,
    refresh: () => fetchPilots(championshipId),
  };
}
