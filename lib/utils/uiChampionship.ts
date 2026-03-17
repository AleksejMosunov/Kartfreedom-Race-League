type ChampionshipType = "solo" | "teams" | "sprint-pro";

type ChampionshipOption = {
  _id: string;
  championshipType: ChampionshipType;
};

export function sortSprintFirst<T extends ChampionshipOption>(
  championships: T[],
): T[] {
  return [...championships].sort((a, b) => {
    // order: solo first, then sprint-pro, then teams
    const rank = (c: ChampionshipOption) =>
      c.championshipType === "solo"
        ? 0
        : c.championshipType === "sprint-pro"
          ? 1
          : 2;
    const ra = rank(a);
    const rb = rank(b);
    if (ra === rb) return 0;
    return ra < rb ? -1 : 1;
  });
}

export function getPreferredUiChampionshipId<T extends ChampionshipOption>(
  championships: T[],
): string {
  // prefer an explicit 'solo' entry first; if none, fall back to 'sprint-pro', then first available
  const solo = championships.find((item) => item.championshipType === "solo");
  if (solo) return solo._id;
  const sprintPro = championships.find(
    (item) => item.championshipType === "sprint-pro",
  );
  if (sprintPro) return sprintPro._id;
  return championships[0]?._id ?? "";
}
