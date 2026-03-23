import { PilotsHub } from "@/app/components/pilots/PilotsHub";
import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import { sortSprintFirst } from "@/lib/utils/uiChampionship";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isValidAdminSession, AUTH_COOKIE_NAME } from "@/lib/auth";

export const metadata = {
  title: "Пілоти — KartFreedom Race League",
};

export default async function PilotsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const isAdmin = await isValidAdminSession(token);
  if (!isAdmin) return notFound();
  const { active, preseasonNews } = await getPublicChampionshipStatus();

  if (!active.length) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  const activeTabs = sortSprintFirst(active.map((item) => ({
    _id: String(item._id),
    name: item.name,
    championshipType: item.championshipType,
  })));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <PilotsHub active={activeTabs} />
    </main>
  );
}
