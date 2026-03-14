type ChampionshipType = "solo" | "teams";

type ChampionshipOption = {
  _id: string;
  championshipType: ChampionshipType;
};

export function getPreferredUiChampionshipId<T extends ChampionshipOption>(
  championships: T[],
): string {
  const sprint = championships.find((item) => item.championshipType === "solo");
  return sprint?._id ?? championships[0]?._id ?? "";
}
