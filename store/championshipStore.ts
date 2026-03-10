import { create } from "zustand";
import { ChampionshipStanding } from "@/types";

interface ChampionshipState {
  standings: ChampionshipStanding[];
  isLoading: boolean;
  error: string | null;
  fetchStandings: () => Promise<void>;
}

export const useChampionshipStore = create<ChampionshipState>((set) => ({
  standings: [],
  isLoading: false,
  error: null,

  fetchStandings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/championship");
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
