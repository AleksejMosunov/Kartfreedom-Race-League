import mongoose, { Document, Schema, model, models } from "mongoose";

export interface IPilotBallastAdjustment extends Document {
  championshipId: mongoose.Types.ObjectId;
  pilotId: mongoose.Types.ObjectId;
  kg: number;
  reason: string;
  createdAt: Date;
}

const PilotBallastAdjustmentSchema = new Schema<IPilotBallastAdjustment>(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
      index: true,
    },
    pilotId: {
      type: Schema.Types.ObjectId,
      ref: "Pilot",
      required: true,
      index: true,
    },
    kg: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.PilotBallastAdjustment) {
  delete models.PilotBallastAdjustment;
}

export const PilotBallastAdjustment =
  models.PilotBallastAdjustment ||
  model<IPilotBallastAdjustment>(
    "PilotBallastAdjustment",
    PilotBallastAdjustmentSchema,
  );
