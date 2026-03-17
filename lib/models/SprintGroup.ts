import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISprintGroup extends Document {
  championshipId: mongoose.Types.ObjectId;
  stageId: mongoose.Types.ObjectId;
  groupNumber: number;
  pilotIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const SprintGroupSchema = new Schema<ISprintGroup>(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
      index: true,
    },
    stageId: {
      type: Schema.Types.ObjectId,
      ref: "Stage",
      required: true,
      index: true,
    },
    groupNumber: { type: Number, required: true },
    pilotIds: [{ type: Schema.Types.ObjectId, ref: "Pilot", required: true }],
  },
  { timestamps: true },
);

SprintGroupSchema.index({ stageId: 1, groupNumber: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && models.SprintGroup) {
  delete models.SprintGroup;
}

export const SprintGroup =
  models.SprintGroup || model<ISprintGroup>("SprintGroup", SprintGroupSchema);
