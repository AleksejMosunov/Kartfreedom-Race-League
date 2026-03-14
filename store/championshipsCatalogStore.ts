import { create } from "zustand";

export type ChampionshipType = "solo" | "teams";

export type ChampionshipCatalogItem = {
  _id: string;
  name: string;
  championshipType: ChampionshipType;
  status?: "active" | "archived";
  fastestLapBonusEnabled?: boolean;
};

type ChampionshipsCatalogResponse = {
  active?: ChampionshipCatalogItem[];
  current?: ChampionshipCatalogItem | null;
  preseasonNews?: string;
};

interface ChampionshipsCatalogState {
  active: ChampionshipCatalogItem[];
  current: ChampionshipCatalogItem | null;
  preseasonNews: string;
  isLoading: boolean;
  error: string | null;
  fetchedAt: number;
  hasLoaded: boolean;
  fetchCatalog: (force?: boolean) => Promise<void>;
}

const CATALOG_TTL_MS = 60 * 1000;
let _catalogInflight: Promise<void> | null = null;

function isFresh(fetchedAt: number) {
  return fetchedAt > 0 && Date.now() - fetchedAt < CATALOG_TTL_MS;
}

export const useChampionshipsCatalogStore = create<ChampionshipsCatalogState>(
  (set, get) => ({
    active: [],
    current: null,
    preseasonNews: "",
    isLoading: false,
    error: null,
    fetchedAt: 0,
    hasLoaded: false,

    fetchCatalog: async (force = false): Promise<void> => {
      const state = get();
      if (!force && state.hasLoaded && isFresh(state.fetchedAt)) {
        return;
      }

      if (_catalogInflight) return _catalogInflight;

      const promise = (async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/championships", { cache: "no-store" });
          if (!res.ok) throw new Error("Не вдалося завантажити чемпіонати");

          const payload = (await res.json()) as ChampionshipsCatalogResponse;
          set({
            active: payload.active ?? [],
            current: payload.current ?? null,
            preseasonNews: payload.preseasonNews ?? "",
            fetchedAt: Date.now(),
            hasLoaded: true,
            error: null,
          });
        } catch (error) {
          set({
            error: (error as Error).message,
            hasLoaded: true,
          });
        } finally {
          set({ isLoading: false });
          _catalogInflight = null;
        }
      })();

      _catalogInflight = promise;
      return promise;
    },
  }),
);
