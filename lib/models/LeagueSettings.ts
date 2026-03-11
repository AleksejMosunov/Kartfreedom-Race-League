import { Document, Schema, model, models } from "mongoose";

export interface ILeagueSettings extends Document {
  key: string;
  preseasonNews: string;
  updatedAt: Date;
}

const LeagueSettingsSchema = new Schema<ILeagueSettings>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    preseasonNews: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.LeagueSettings) {
  delete models.LeagueSettings;
}

export const LeagueSettings =
  models.LeagueSettings ||
  model<ILeagueSettings>("LeagueSettings", LeagueSettingsSchema);
