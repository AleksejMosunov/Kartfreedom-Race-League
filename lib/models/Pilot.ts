import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IPilot extends Document {
  name: string;
  number: number;
  avatar?: string;
  createdAt: Date;
}

const PilotSchema = new Schema<IPilot>(
  {
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true, unique: true },
    avatar: { type: String },
  },
  { timestamps: true },
);

export const Pilot = models.Pilot || model<IPilot>("Pilot", PilotSchema);
