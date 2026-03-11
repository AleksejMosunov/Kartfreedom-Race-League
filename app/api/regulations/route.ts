import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Regulations } from "@/lib/models/Regulations";
import { defaultRegulationsContent } from "@/lib/regulations/defaultContent";
import { RegulationSection, RegulationsContent } from "@/types";

const REGULATIONS_SLUG = "main";

function isValidSection(section: RegulationSection) {
  return (
    typeof section?.title === "string" &&
    section.title.trim().length > 0 &&
    typeof section?.content === "string" &&
    section.content.trim().length > 0
  );
}

function normalizeContent(input: RegulationsContent): RegulationsContent {
  return {
    title: input.title.trim(),
    intro: input.intro.trim(),
    sections: input.sections.map((section) => ({
      title: section.title.trim(),
      content: section.content.trim(),
    })),
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    const doc = await Regulations.findOne({ slug: REGULATIONS_SLUG }).lean();

    if (!doc) {
      return NextResponse.json(defaultRegulationsContent);
    }

    return NextResponse.json({
      title: doc.title,
      intro: doc.intro,
      sections: doc.sections,
    });
  } catch {
    return NextResponse.json(defaultRegulationsContent);
  }
}

export async function PUT(req: NextRequest) {
  await connectToDatabase();

  const body = (await req.json()) as Partial<RegulationsContent>;

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    typeof body.intro !== "string" ||
    !body.intro.trim() ||
    !Array.isArray(body.sections) ||
    body.sections.length === 0 ||
    !body.sections.every((section) =>
      isValidSection(section as RegulationSection),
    )
  ) {
    return NextResponse.json(
      { error: "Invalid regulations payload" },
      { status: 400 },
    );
  }

  const normalized = normalizeContent(body as RegulationsContent);

  const saved = await Regulations.findOneAndUpdate(
    { slug: REGULATIONS_SLUG },
    {
      slug: REGULATIONS_SLUG,
      title: normalized.title,
      intro: normalized.intro,
      sections: normalized.sections,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return NextResponse.json({
    title: saved.title,
    intro: saved.intro,
    sections: saved.sections,
  });
}
