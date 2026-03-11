import mongoose, { Document, Schema, model, models } from "mongoose";

export interface IPilotBallastAdjustment extends Document {
  pilotId: mongoose.Types.ObjectId;
  kg: number;
  reason: string;
  createdAt: Date;
}

const PilotBallastAdjustmentSchema = new Schema<IPilotBallastAdjustment>(
  {
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

export const PilotBallastAdjustment =
  models.PilotBallastAdjustment ||
  model<IPilotBallastAdjustment>(
    "PilotBallastAdjustment",
    PilotBallastAdjustmentSchema,
  );
