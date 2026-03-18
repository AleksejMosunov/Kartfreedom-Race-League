type ChampionshipType = "sprint" | "sprint-pro";

type ChampionshipOption = {
  _id: string;
  championshipType: ChampionshipType;
};

export function sortSprintFirst<T extends ChampionshipOption>(
  championships: T[],
): T[] {
  return [...championships].sort((a, b) => {
    // order: sprint first, then sprint-pro
    const rank = (c: ChampionshipOption) =>
      c.championshipType === "sprint" ? 0 : 1;
    const ra = rank(a);
    const rb = rank(b);
    if (ra === rb) return 0;
    return ra < rb ? -1 : 1;
  });
}

export function getPreferredUiChampionshipId<T extends ChampionshipOption>(
  championships: T[],
): string {
  // prefer an explicit 'sprint' entry first; if none, fall back to 'sprint-pro', then first available
  const sprint = championships.find(
    (item) => item.championshipType === "sprint",
  );
  if (sprint) return sprint._id;
  const sprintPro = championships.find(
    (item) => item.championshipType === "sprint-pro",
  );
  if (sprintPro) return sprintPro._id;
  return championships[0]?._id ?? "";
}
