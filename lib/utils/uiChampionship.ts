type ChampionshipType = "solo" | "teams";

type ChampionshipOption = {
  _id: string;
  championshipType: ChampionshipType;
};

export function sortSprintFirst<T extends ChampionshipOption>(
  championships: T[],
): T[] {
  return [...championships].sort((a, b) => {
    if (a.championshipType === b.championshipType) return 0;
    return a.championshipType === "solo" ? -1 : 1;
  });
}

export function getPreferredUiChampionshipId<T extends ChampionshipOption>(
  championships: T[],
): string {
  const sprint = championships.find((item) => item.championshipType === "solo");
  return sprint?._id ?? championships[0]?._id ?? "";
}
