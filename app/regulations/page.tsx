import { connectToDatabase } from "@/lib/mongodb";
import { Regulations } from "@/lib/models/Regulations";
import { defaultRegulationsContent } from "@/lib/regulations/defaultContent";

export const metadata = {
  title: "KartFreedom Race League — Регламент",
  description: "Офіційний регламент проведення чемпіонату KartFreedom Race League",
};

export default async function RegulationsPage() {
  let content = defaultRegulationsContent;

  try {
    await connectToDatabase();
    const doc = await Regulations.findOne({ slug: "main" }).lean();
    if (doc) {
      content = {
        title: doc.title,
        intro: doc.intro,
        sections: doc.sections,
      };
    }
  } catch {
    content = defaultRegulationsContent;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{content.title}</h1>
        <p className="text-zinc-400 mt-2">{content.intro}</p>
      </div>

      <section className="space-y-6 text-zinc-200">
        {content.sections.map((section) => (
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
