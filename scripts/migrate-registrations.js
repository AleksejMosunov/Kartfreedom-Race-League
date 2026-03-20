#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

async function main() {
  const clearLegacy = process.argv.includes("--clear-legacy");
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Please set MONGODB_URI environment variable before running.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  console.log("Loaded DB; fetching stages...");
  const stages = await db.collection("stages").find({}).toArray();
  const stageToChamp = new Map();
  const stagesByChamp = new Map();
  for (const s of stages) {
    const sid = String(s._id);
    const cid = s.championshipId ? String(s.championshipId) : null;
    stageToChamp.set(sid, cid);
    if (cid) {
      if (!stagesByChamp.has(cid)) stagesByChamp.set(cid, []);
      stagesByChamp.get(cid).push(sid);
    }
  }

  console.log(`Found ${stages.length} stages, ${stageToChamp.size} mapped.`);

  const pilotsColl = db.collection("pilots");
  const cursor = pilotsColl.find({});
  let processed = 0;
  let updated = 0;

  while (await cursor.hasNext()) {
    const pilot = await cursor.next();
    processed++;
    const keyMap = new Map();

    const pushReg = (reg) => {
      const champ = reg.championshipId ? String(reg.championshipId) : (pilot.championshipId ? String(pilot.championshipId) : null);
      const stage = reg.stageId ? String(reg.stageId) : null;
      if (!champ || !stage) return; // our canonical registrations require both
      const key = `${champ}:${stage}`;
      if (!keyMap.has(key)) keyMap.set(key, reg);
    };

    // Start with existing registrations
    if (Array.isArray(pilot.registrations)) {
      for (const r of pilot.registrations) {
        const reg = {
          championshipId: r.championshipId ? String(r.championshipId) : (pilot.championshipId ? String(pilot.championshipId) : null),
          stageId: r.stageId ? String(r.stageId) : null,
          firstRace: !!r.firstRace,
          secondRace: !!r.secondRace,
          racesCount: r.racesCount || (r.firstRace && r.secondRace ? 2 : 1),
        };
        pushReg(reg);
      }
    }

    // Migrate registeredStageIds
    if (Array.isArray(pilot.registeredStageIds)) {
      for (const sidRaw of pilot.registeredStageIds) {
        const sid = String(sidRaw);
        const champ = stageToChamp.get(sid) || (pilot.championshipId ? String(pilot.championshipId) : null);
        if (!champ) continue;
        const reg = {
          championshipId: champ,
          stageId: sid,
          firstRace: !!pilot.firstRace || (pilot.racesCount === 2),
          secondRace: !!pilot.secondRace || (pilot.racesCount === 2),
          racesCount: pilot.racesCount || ((pilot.firstRace && pilot.secondRace) ? 2 : 1),
        };
        pushReg(reg);
      }
    }

    // Migrate single stageId
    if (pilot.stageId) {
      const sid = String(pilot.stageId);
      const champ = stageToChamp.get(sid) || (pilot.championshipId ? String(pilot.championshipId) : null);
      if (champ) {
        const reg = {
          championshipId: champ,
          stageId: sid,
          firstRace: !!pilot.firstRace || (pilot.racesCount === 2),
          secondRace: !!pilot.secondRace || (pilot.racesCount === 2),
          racesCount: pilot.racesCount || ((pilot.firstRace && pilot.secondRace) ? 2 : 1),
        };
        pushReg(reg);
      }
    }

    // If pilot has top-level championshipId and no per-championship regs, create regs for all stages in that championship
    if (pilot.championshipId) {
      const champ = String(pilot.championshipId);
      const hasForChamp = Array.from(keyMap.keys()).some((k) => k.startsWith(champ + ":"));
      if (!hasForChamp) {
        const champsStages = stagesByChamp.get(champ) || [];
        for (const sid of champsStages) {
          const reg = {
            championshipId: champ,
            stageId: sid,
            firstRace: !!pilot.firstRace || (pilot.racesCount === 2),
            secondRace: !!pilot.secondRace || (pilot.racesCount === 2),
            racesCount: pilot.racesCount || ((pilot.firstRace && pilot.secondRace) ? 2 : 1),
          };
          pushReg(reg);
        }
      }
    }

    const newRegs = Array.from(keyMap.values()).map((r) => ({
      championshipId: new ObjectId(r.championshipId),
      stageId: new ObjectId(r.stageId),
      firstRace: !!r.firstRace,
      secondRace: !!r.secondRace,
      racesCount: r.racesCount === 2 ? 2 : 1,
    }));

    if (newRegs.length > 0) {
      const update = { $set: { registrations: newRegs } };
      if (clearLegacy) {
        update.$unset = {
          registeredStageIds: "",
          stageId: "",
          racesCount: "",
          firstRace: "",
          secondRace: "",
          championshipId: "",
        };
      }
      await pilotsColl.updateOne({ _id: pilot._id }, update);
      updated++;
    }

    if (processed % 200 === 0) console.log(`Processed ${processed} pilots, updated ${updated}`);
  }

  console.log(`Done. Processed ${processed} pilots, updated ${updated}.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
