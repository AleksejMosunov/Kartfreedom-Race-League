import { Document, Schema, model, models } from "mongoose";

interface IBallastRule {
  position: number;
  kg: number;
}

export interface IBallastConfig extends Document {
  slug: string;
  rules: IBallastRule[];
}

const BallastRuleSchema = new Schema<IBallastRule>(
  {
    position: { type: Number, required: true, min: 1 },
    kg: { type: Number, required: true },
  },
  { _id: false },
);

const BallastConfigSchema = new Schema<IBallastConfig>(
  {
    slug: { type: String, required: true, unique: true, default: "main" },
    rules: { type: [BallastRuleSchema], default: [] },
  },
  { timestamps: true },
);

export const BallastConfig =
  models.BallastConfig ||
  model<IBallastConfig>("BallastConfig", BallastConfigSchema);
