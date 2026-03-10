import { ChampionshipStanding } from "@/types";

export async function fetchChampionshipStandings(): Promise<
  ChampionshipStanding[]
> {
  const res = await fetch("/api/championship");
  if (!res.ok) throw new Error("Не удалось загрузить таблицу чемпионата");
  return res.json();
}
