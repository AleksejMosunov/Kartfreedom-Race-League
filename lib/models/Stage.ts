import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IStageResult {
  pilotId: mongoose.Types.ObjectId;
  position: number;
  points: number;
  dnf: boolean;
  dns: boolean;
}

export interface IStage extends Document {
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
  },
  { _id: false },
);

const StageSchema = new Schema<IStage>(
  {
    name: { type: String, required: true, trim: true },
    number: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    results: { type: [StageResultSchema], default: [] },
  },
  { timestamps: true },
);

export const Stage = models.Stage || model<IStage>("Stage", StageSchema);
