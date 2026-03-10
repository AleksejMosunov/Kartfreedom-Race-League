import { useEffect } from "react";
import { usePilotsStore } from "@/store/pilotsStore";

export function usePilots() {
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
    fetchPilots();
  }, [fetchPilots]);

  return {
    pilots,
    isLoading,
    error,
    addPilot,
    updatePilot,
    deletePilot,
    refresh: fetchPilots,
  };
}
