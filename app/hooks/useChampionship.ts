import { useEffect } from "react";
import { useChampionshipStore } from "@/store/championshipStore";

export function useChampionship(championshipId?: string) {
  const { standings, isLoading, error, fetchStandings } =
    useChampionshipStore();

  useEffect(() => {
    fetchStandings(championshipId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championshipId]);

  return {
    standings,
    isLoading,
    error,
    refresh: () => fetchStandings(championshipId),
  };
}
