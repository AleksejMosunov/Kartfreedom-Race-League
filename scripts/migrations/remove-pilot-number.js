#!/usr/bin/env node
// Migration script: remove `number` field from Pilot documents and drop related index.

/* eslint-disable @typescript-eslint/no-require-imports */

const { connectToDatabase } = require("../../lib/mongodb");
const { Pilot } = require("../../lib/models/Pilot");

async function run() {
  try {
    await connectToDatabase();
    console.log("Connected to DB");

    // Unset number field from all Pilot documents
    const unsetResult = await Pilot.updateMany({}, { $unset: { number: "" } });
    console.log(`Unset 'number' field in ${unsetResult.modifiedCount} documents (matched ${unsetResult.matchedCount}).`);

    // Attempt to drop the index if it exists
    const indexes = await Pilot.collection.indexes();
    const idx = indexes.find((i) => i.key && i.key.championshipId === 1 && i.key.number === 1);
    if (idx) {
      try {
        await Pilot.collection.dropIndex(idx.name);
        console.log(`Dropped index: ${idx.name}`);
      } catch (err) {
        console.warn("Failed to drop index:", err.message || err);
      }
    } else {
      console.log("No championshipId+number index found.");
    }

    console.log("Migration finished.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
