import mongoose from "mongoose";
import { Pilot } from "@/lib/models/Pilot";
import { Stage } from "@/lib/models/Stage";
import { BallastConfig } from "@/lib/models/BallastConfig";
import { PilotBallastAdjustment } from "@/lib/models/PilotBallastAdjustment";
import { Championship } from "@/lib/models/Championship";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { Team } from "@/lib/models/Team";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local",
  );
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  indexesSynced?: boolean;
};

declare global {
  var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose ?? {
  conn: null,
  promise: null,
  indexesSynced: false,
};
global.mongoose = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;

    if (!cached.indexesSynced) {
      await Promise.all([
        Championship.syncIndexes(),
        Pilot.syncIndexes(),
        Stage.syncIndexes(),
        BallastConfig.syncIndexes(),
        PilotBallastAdjustment.syncIndexes(),
        LeagueSettings.syncIndexes(),
        Team.syncIndexes(),
      ]);
      cached.indexesSynced = true;
    }

    return cached.conn;
  } catch (error) {
    // Reset cached state so the next request can retry a fresh connection.
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
