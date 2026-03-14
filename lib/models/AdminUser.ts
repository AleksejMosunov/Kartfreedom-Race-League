import { Document, Schema, model, models } from "mongoose";

export type AdminUserRole = "organizer" | "marshal" | "editor";

export interface IAdminUser extends Document {
  username: string;
  passwordHash: string;
  role: AdminUserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["organizer", "marshal", "editor"],
      default: "editor",
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.AdminUser) {
  delete models.AdminUser;
}

export const AdminUser =
  models.AdminUser || model<IAdminUser>("AdminUser", AdminUserSchema);
