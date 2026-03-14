import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Championship } from "@/lib/models/Championship";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { RegulationSection, RegulationsContent } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

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

export async function GET(_req: NextRequest, { params }: Params) {
  await connectToDatabase();
  const { id } = await params;

  const championship = await Championship.findById(id).lean();
  if (!championship) {
    return NextResponse.json(
      { error: "Championship not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(championship.regulations);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();
  const { id } = await params;

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

  const updated = await Championship.findByIdAndUpdate(
    id,
    { regulations: normalized },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { error: "Championship not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(updated.regulations);
}
