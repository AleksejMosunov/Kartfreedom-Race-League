import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BallastConfig } from "@/lib/models/BallastConfig";
import { initialBallastRules } from "@/lib/ballast/defaultConfig";
import { BallastRule } from "@/types";
import { normalizeBallastRules } from "@/lib/utils/ballast";

const BALLAST_SLUG = "main";

export async function PUT(req: NextRequest) {
  await connectToDatabase();
  const body = (await req.json()) as { rules?: BallastRule[] };

  if (!Array.isArray(body.rules) || body.rules.length === 0) {
    return NextResponse.json({ error: "Rules are required" }, { status: 400 });
  }

  const normalized = normalizeBallastRules(body.rules);
  const hasInvalid = normalized.some((rule) => rule.position < 1);
  if (hasInvalid) {
    return NextResponse.json(
      { error: "Position must be >= 1" },
      { status: 400 },
    );
  }

  const dedupedByPosition = new Map<number, BallastRule>();
  normalized.forEach((rule) => dedupedByPosition.set(rule.position, rule));
  const finalRules = Array.from(dedupedByPosition.values()).sort(
    (a, b) => a.position - b.position,
  );

  await BallastConfig.findOneAndUpdate(
    { slug: BALLAST_SLUG },
    {
      slug: BALLAST_SLUG,
      rules: finalRules.length ? finalRules : initialBallastRules,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return NextResponse.json({ rules: finalRules });
}
