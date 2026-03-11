import { Championship } from "@/lib/models/Championship";

export async function getCurrentChampionship() {
  return Championship.findOne({ status: "active" })
    .sort({ startedAt: -1 })
    .lean();
}

export async function requireCurrentChampionship() {
  const current = await getCurrentChampionship();
  if (!current) {
    const error = new Error("No active championship");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }
  return current;
}
