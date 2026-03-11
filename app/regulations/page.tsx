import { NoActiveChampionshipBlock } from "@/app/components/championship/NoActiveChampionshipBlock";
import { getPublicChampionshipStatus } from "@/lib/championship/public";
import { RegulationsContent } from "@/types";

export const metadata = {
  title: "KartFreedom Race League — Регламент",
  description: "Офіційний регламент проведення чемпіонату KartFreedom Race League",
};

export default async function RegulationsPage() {
  const { current, preseasonNews } = await getPublicChampionshipStatus();

  if (!current) {
    return <NoActiveChampionshipBlock news={preseasonNews} />;
  }

  const content = current.regulations as RegulationsContent | undefined;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{content?.title}</h1>
        <p className="text-zinc-400 mt-2">{content?.intro}</p>
      </div>

      <section className="space-y-6 text-zinc-200">
        {(content?.sections ?? []).map((section) => (
          <article
            key={section.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <h2 className="text-xl font-bold text-white mb-2">{section.title}</h2>
            <p>{section.content}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
