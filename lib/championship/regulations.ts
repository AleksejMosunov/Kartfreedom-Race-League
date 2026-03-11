import { defaultRegulationsContent } from "@/lib/regulations/defaultContent";

export function normalizeRegulationsPayload(input: {
  title?: string;
  intro?: string;
  sections?: Array<{ title?: string; content?: string }>;
}) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const intro = typeof input.intro === "string" ? input.intro.trim() : "";
  const sections = Array.isArray(input.sections)
    ? input.sections
        .map((section) => ({
          title: typeof section.title === "string" ? section.title.trim() : "",
          content:
            typeof section.content === "string" ? section.content.trim() : "",
        }))
        .filter((section) => section.title && section.content)
    : [];

  if (!title || !intro || sections.length === 0) {
    return null;
  }

  return { title, intro, sections };
}

export function defaultRegulationsForNewChampionship() {
  return {
    title: defaultRegulationsContent.title,
    intro: defaultRegulationsContent.intro,
    sections: defaultRegulationsContent.sections.map((section) => ({
      title: section.title,
      content: section.content,
    })),
  };
}
