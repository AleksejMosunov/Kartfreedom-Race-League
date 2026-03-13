import { create } from "zustand";
import { ChampionshipStanding } from "@/types";

interface ChampionshipState {
  standings: ChampionshipStanding[];
  isLoading: boolean;
  error: string | null;
  fetchStandings: (championshipId?: string) => Promise<void>;
}

export const useChampionshipStore = create<ChampionshipState>((set) => ({
  standings: [],
  isLoading: false,
  error: null,

  fetchStandings: async (championshipId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = championshipId
        ? `/api/championship?championship=${encodeURIComponent(championshipId)}`
        : "/api/championship";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Помилка завантаження таблиці чемпіонату");
      const data: ChampionshipStanding[] = await res.json();
      set({ standings: data });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
