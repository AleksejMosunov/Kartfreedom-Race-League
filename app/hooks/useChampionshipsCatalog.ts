import { useEffect } from "react";
import { useChampionshipsCatalogStore } from "@/store/championshipsCatalogStore";

interface UseChampionshipsCatalogOptions {
  enabled?: boolean;
  force?: boolean;
}

export function useChampionshipsCatalog(
  options?: UseChampionshipsCatalogOptions,
) {
  const {
    active,
    current,
    preseasonNews,
    isLoading,
    error,
    hasLoaded,
    fetchCatalog,
  } = useChampionshipsCatalogStore();

  const enabled = options?.enabled ?? true;
  const force = options?.force ?? false;

  useEffect(() => {
    if (!enabled) return;
    void fetchCatalog(force);
  }, [enabled, force, fetchCatalog]);

  return {
    active,
    current,
    preseasonNews,
    // Expose a loading flag that's true until the catalog has loaded at least once.
    // This avoids rendering empty/placeholder UI on first client render before the
    // fetch effect runs.
    isLoading: isLoading || !hasLoaded,
    error,
    hasLoaded,
    refresh: () => fetchCatalog(true),
  };
}
