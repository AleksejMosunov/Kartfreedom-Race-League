import { Document, Schema, model, models } from "mongoose";
import { SOCIAL_LINK_DEFAULTS, SocialLinks } from "@/lib/socialLinks";

export interface ILeagueSettings extends Document {
  key: string;
  preseasonNews: string;
  preseasonNewsSolo?: string;
  preseasonNewsTeams?: string;
  alertChatId?: string;
  socialLinks?: SocialLinks;
  updatedAt: Date;
}

const LeagueSettingsSchema = new Schema<ILeagueSettings>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    preseasonNews: { type: String, default: "", trim: true },
    preseasonNewsSolo: { type: String, default: "", trim: true },
    preseasonNewsTeams: { type: String, default: "", trim: true },
    alertChatId: { type: String, default: "", trim: true },
    socialLinks: {
      telegram: {
        type: String,
        default: SOCIAL_LINK_DEFAULTS.telegram,
        trim: true,
      },
      instagram: {
        type: String,
        default: SOCIAL_LINK_DEFAULTS.instagram,
        trim: true,
      },
      facebook: {
        type: String,
        default: SOCIAL_LINK_DEFAULTS.facebook,
        trim: true,
      },
      youtube: {
        type: String,
        default: SOCIAL_LINK_DEFAULTS.youtube,
        trim: true,
      },
    },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && models.LeagueSettings) {
  delete models.LeagueSettings;
}

export const LeagueSettings =
  models.LeagueSettings ||
  model<ILeagueSettings>("LeagueSettings", LeagueSettingsSchema);
