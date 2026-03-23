import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Pilot } from "@/lib/models/Pilot";
import { Championship } from "@/lib/models/Championship";
import { Stage } from "@/lib/models/Stage";
import { normalizePhone, isValidUkrPhone } from "@/lib/utils/phone";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const phone = normalizePhone(phoneRaw);

  if (!isValidUkrPhone(phone)) {
    return NextResponse.json(
      { error: "Вкажіть дійсний номер у форматі +380XXXXXXXXX" },
      { status: 400 },
    );
  }

  try {
    const pilot = await Pilot.findOne({ phone })
      .select({ registrations: 1 })
      .lean();
    if (
      !pilot ||
      !Array.isArray(pilot.registrations) ||
      pilot.registrations.length === 0
    ) {
      return NextResponse.json({ registrations: [] }, { status: 200 });
    }

    // Normalize registrations entries and group by championship
    const regs = pilot.registrations as any[];
    const byChamp: Record<
      string,
      { championshipId: string; stages: Array<any> }
    > = {};
    const stageIdsToLoad: string[] = [];
    const champIdsToLoad: string[] = [];

    for (const r of regs) {
      if (!r || !r.stageId) continue;
      const champId = String(r.championshipId ?? "");
      if (!byChamp[champId])
        byChamp[champId] = { championshipId: champId, stages: [] };
      const first = Boolean(r.firstRace);
      const second = Boolean(r.secondRace);
      const races: number[] = [];
      if (first) races.push(1);
      if (second) races.push(2);
      // fallback to racesCount
      if (races.length === 0 && r.racesCount === 2) {
        races.push(1, 2);
      }
      byChamp[champId].stages.push({
        stageId: String(r.stageId),
        stageName: null,
        races,
      });
      stageIdsToLoad.push(String(r.stageId));
      if (champId) champIdsToLoad.push(champId);
    }

    // load stage names
    const stages = await Stage.find({ _id: { $in: stageIdsToLoad } })
      .select({ _id: 1, name: 1 })
      .lean();
    const stageNameMap: Record<string, string> = {};
    for (const s of stages)
      stageNameMap[String(s._id)] = s.name ?? String(s._id);

    // load championship names
    const champs = await Championship.find({ _id: { $in: champIdsToLoad } })
      .select({ _id: 1, name: 1 })
      .lean();
    const champNameMap: Record<string, string> = {};
    for (const c of champs)
      champNameMap[String(c._id)] = c.name ?? String(c._id);

    const result: Array<any> = [];
    for (const champId of Object.keys(byChamp)) {
      const entry = byChamp[champId];
      const stagesOut = entry.stages.map((st: any) => ({
        stageId: st.stageId,
        stageName: stageNameMap[st.stageId] ?? null,
        races: st.races,
      }));
      result.push({
        championshipId: champId,
        championshipName: champNameMap[champId] ?? null,
        stages: stagesOut,
      });
    }

    return NextResponse.json({ registrations: result }, { status: 200 });
  } catch (err) {
    console.error("check-registrations error:", err);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 },
    );
  }
}
