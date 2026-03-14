import { Document, Schema, model, models } from "mongoose";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "finish"
  | "restore"
  | "import"
  | "role_change"
  | "deactivate"
  | "activate"
  | "create_user";

export type AuditEntityType =
  | "championship"
  | "stage"
  | "pilot"
  | "team"
  | "admin_user";

export interface IAuditLog extends Document {
  adminUserId: string | null;
  adminUsername: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string;
  createdAt: Date;
}

// TTL: 100 days in seconds
const TTL_SECONDS = 100 * 24 * 60 * 60;

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminUserId: { type: String, default: null },
    adminUsername: { type: String, default: "unknown" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    entityLabel: { type: String, default: "" },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, expires: TTL_SECONDS },
  },
  { timestamps: false, versionKey: false },
);

AuditLogSchema.index({ entityType: 1, createdAt: -1 });
AuditLogSchema.index({ adminUserId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && models.AuditLog) {
  delete models.AuditLog;
}

export const AuditLog =
  models.AuditLog || model<IAuditLog>("AuditLog", AuditLogSchema);
