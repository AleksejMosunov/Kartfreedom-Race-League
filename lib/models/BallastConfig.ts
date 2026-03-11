import { Document, Schema, model, models } from "mongoose";

interface IBallastRule {
  position: number;
  kg: number;
}

export interface IBallastConfig extends Document {
  championshipId: string;
  rules: IBallastRule[];
}

const BallastRuleSchema = new Schema<IBallastRule>(
  {
    position: { type: Number, required: true, min: 1 },
    kg: { type: Number, required: true },
  },
  { _id: false },
);

const BallastConfigSchema = new Schema(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
      unique: true,
      index: true,
    },
    rules: { type: [BallastRuleSchema], default: [] },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.BallastConfig) {
  delete models.BallastConfig;
}

export const BallastConfig =
  models.BallastConfig ||
  model<IBallastConfig>("BallastConfig", BallastConfigSchema);
