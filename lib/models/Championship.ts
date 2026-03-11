import { Document, Schema, model, models } from "mongoose";
import { defaultRegulationsForNewChampionship } from "@/lib/championship/regulations";

interface IRegulationsSection {
  title: string;
  content: string;
}

interface IRegulations {
  title: string;
  intro: string;
  sections: IRegulationsSection[];
}

export interface IChampionship extends Document {
  name: string;
  status: "active" | "archived";
  championshipType: "solo" | "teams";
  startedAt: Date;
  endedAt?: Date;
  regulations: IRegulations;
  createdAt: Date;
  updatedAt: Date;
}

const RegulationsSectionSchema = new Schema<IRegulationsSection>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const RegulationsSchema = new Schema<IRegulations>(
  {
    title: { type: String, required: true, trim: true },
    intro: { type: String, required: true, trim: true },
    sections: { type: [RegulationsSectionSchema], default: [] },
  },
  { _id: false },
);

const ChampionshipSchema = new Schema<IChampionship>(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      required: true,
      default: "active",
      index: true,
    },
    championshipType: {
      type: String,
      enum: ["solo", "teams"],
      required: true,
      default: "solo",
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    regulations: {
      type: RegulationsSchema,
      required: true,
      default: () => defaultRegulationsForNewChampionship(),
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.Championship) {
  delete models.Championship;
}

export const Championship =
  models.Championship ||
  model<IChampionship>("Championship", ChampionshipSchema);
