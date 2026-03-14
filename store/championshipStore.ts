import { create } from "zustand";
import { ChampionshipStanding } from "@/types";

interface ChampionshipState {
  standings: ChampionshipStanding[];
  isLoading: boolean;
  error: string | null;
  fetchStandings: (championshipId?: string) => Promise<void>;
}

const _championshipInflight = new Map<string, Promise<void>>();

export const useChampionshipStore = create<ChampionshipState>((set) => ({
  standings: [],
  isLoading: false,
  error: null,

  fetchStandings: async (championshipId?: string): Promise<void> => {
    const key = championshipId ?? "";
    const inflight = _championshipInflight.get(key);
    if (inflight) return inflight;
    const promise = (async () => {
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
        _championshipInflight.delete(key);
      }
    })();
    _championshipInflight.set(key, promise);
    return promise;
  },
}));
