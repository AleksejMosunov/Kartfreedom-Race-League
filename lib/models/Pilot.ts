import mongoose, { Schema, Document, model, models } from "mongoose";
import { isValidNamePart, normalizeNamePart } from "@/lib/utils/pilotName";

export interface IPilot extends Document {
  championshipId: mongoose.Types.ObjectId;
  name: string;
  surname: string;
  number: number;
  phone?: string;
  avatar?: string;
  league: "pro" | "newbie";
  swsId?: string;
  registrations?: {
    championshipId?: mongoose.Types.ObjectId;
    stageId: mongoose.Types.ObjectId;
    firstRace: boolean;
    secondRace: boolean;
    racesCount: number;
  }[];
  createdAt: Date;
}

const PilotSchema = new Schema<IPilot>(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: false,
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
    swsId: { type: String, trim: true },
    // Legacy top-level per-stage/registration fields removed.
    // Use `registrations[]` for per-championship/per-stage registration state.
    registrations: [
      {
        championshipId: {
          type: Schema.Types.ObjectId,
          ref: "Championship",
          required: false,
        },
        stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
        firstRace: { type: Boolean, required: true, default: true },
        secondRace: { type: Boolean, required: true, default: false },
        racesCount: { type: Number, enum: [1, 2], required: true, default: 1 },
      },
    ],
    league: {
      type: String,
      enum: ["pro", "newbie"],
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Unique number per championship only when `championshipId` is present.
PilotSchema.index(
  { championshipId: 1, number: 1 },
  {
    unique: true,
    partialFilterExpression: { championshipId: { $exists: true } },
  },
);

if (process.env.NODE_ENV !== "production" && models.Pilot) {
  delete models.Pilot;
}

export const Pilot = models.Pilot || model<IPilot>("Pilot", PilotSchema);
