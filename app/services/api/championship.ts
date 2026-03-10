import { ChampionshipStanding } from "@/types";

export async function fetchChampionshipStandings(): Promise<
  ChampionshipStanding[]
> {
  const res = await fetch("/api/championship");
  if (!res.ok) throw new Error("Не вдалося завантажити таблицю чемпіонату");
  return res.json();
}
