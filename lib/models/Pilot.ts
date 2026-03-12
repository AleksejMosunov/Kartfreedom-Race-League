import mongoose, { Schema, Document, model, models } from "mongoose";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";

export interface IPilot extends Document {
  championshipId: mongoose.Types.ObjectId;
  name: string;
  surname: string;
  number: number;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

const PilotSchema = new Schema<IPilot>(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => normalizeNamePart(value),
      validate: {
        validator: (value: string) => isValidNamePart(value),
        message: "Pilot name must contain only letters",
      },
    },
    surname: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => normalizeNamePart(value),
      validate: {
        validator: (value: string) => isValidNamePart(value),
        message: "Pilot surname must contain only letters",
      },
    },
    number: {
      type: Number,
      required: true,
      min: 1,
      max: 999,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Pilot number must be an integer",
      },
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
  },
  { timestamps: true },
);

PilotSchema.index({ championshipId: 1, number: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && models.Pilot) {
  delete models.Pilot;
}

export const Pilot = models.Pilot || model<IPilot>("Pilot", PilotSchema);
