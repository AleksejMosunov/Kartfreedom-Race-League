import { useEffect } from "react";
import { useChampionshipStore } from "@/store/championshipStore";

export function useChampionship() {
  const { standings, isLoading, error, fetchStandings } =
    useChampionshipStore();

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return { standings, isLoading, error, refresh: fetchStandings };
}
