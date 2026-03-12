import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IStageResult {
  pilotId: mongoose.Types.ObjectId;
  position: number;
  points: number;
  dnf: boolean;
  dns: boolean;
  bestLap?: boolean;
  penaltyPoints: number;
  penaltyReason: string;
}

export interface IStage extends Document {
  championshipId: mongoose.Types.ObjectId;
  name: string;
  number: number;
  date: Date;
  isCompleted: boolean;
  results: IStageResult[];
  createdAt: Date;
}

const StageResultSchema = new Schema<IStageResult>(
  {
    pilotId: { type: Schema.Types.ObjectId, ref: "Pilot", required: true },
    position: { type: Number, required: true },
    points: { type: Number, required: true, default: 0 },
    dnf: { type: Boolean, default: false },
    dns: { type: Boolean, default: false },
    bestLap: { type: Boolean, default: false },
    penaltyPoints: { type: Number, default: 0, min: 0 },
    penaltyReason: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const StageSchema = new Schema<IStage>(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true },
    date: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    results: { type: [StageResultSchema], default: [] },
  },
  { timestamps: true },
);

StageSchema.index({ championshipId: 1, number: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && models.Stage) {
  delete models.Stage;
}
export const Stage = models.Stage || model<IStage>("Stage", StageSchema);
