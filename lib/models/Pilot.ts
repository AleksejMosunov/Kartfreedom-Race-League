import mongoose, { Schema, Document, model, models } from "mongoose";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";

export interface IPilot extends Document {
  name: string;
  surname: string;
  number: number;
  avatar?: string;
  createdAt: Date;
}

const PilotSchema = new Schema<IPilot>(
  {
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
      unique: true,
      min: 1,
      max: 999,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Pilot number must be an integer",
      },
    },
    avatar: { type: String },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.Pilot) {
  delete models.Pilot;
}

export const Pilot = models.Pilot || model<IPilot>("Pilot", PilotSchema);
