import { Document, Schema, model, models } from "mongoose";

interface IRegulationSection {
  title: string;
  content: string;
}

export interface IRegulations extends Document {
  slug: string;
  title: string;
  intro: string;
  sections: IRegulationSection[];
  updatedAt: Date;
}

const RegulationSectionSchema = new Schema<IRegulationSection>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const RegulationsSchema = new Schema<IRegulations>(
  {
    slug: { type: String, required: true, unique: true, default: "main" },
    title: { type: String, required: true, trim: true },
    intro: { type: String, required: true, trim: true },
    sections: { type: [RegulationSectionSchema], default: [] },
  },
  { timestamps: true },
);

export const Regulations =
  models.Regulations || model<IRegulations>("Regulations", RegulationsSchema);
