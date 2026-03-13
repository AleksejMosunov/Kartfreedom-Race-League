import { Document, Schema, model, models, Types } from "mongoose";

interface ITeamDriver {
  name: string;
  surname: string;
}

export interface ITeam extends Document {
  championshipId: Types.ObjectId;
  name: string;
  number: number;
  phone?: string;
  isSolo: boolean;
  drivers: ITeamDriver[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamDriverSchema = new Schema<ITeamDriver>(
  {
    name: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const TeamSchema = new Schema<ITeam>(
  {
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    number: {
      type: Number,
      required: true,
      min: 1,
      max: 999,
      validate: {
        validator: (value: number) => Number.isInteger(value),
        message: "Team number must be an integer",
      },
    },
    phone: { type: String, trim: true },
    isSolo: { type: Boolean, default: true },
    drivers: { type: [TeamDriverSchema], default: [] },
  },
  { timestamps: true },
);

TeamSchema.index({ championshipId: 1, name: 1 }, { unique: true });
TeamSchema.index({ championshipId: 1, number: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && models.Team) {
  delete models.Team;
}

export const Team = models.Team || model<ITeam>("Team", TeamSchema);
