export type SocialLinkKey =
  | "telegram"
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok";

export type SocialLinks = Record<SocialLinkKey, string>;

export const SOCIAL_LINK_DEFAULTS: SocialLinks = {
  telegram: "https://t.me/kartfreedoms",
  instagram: "https://www.instagram.com/kartfreedom/",
  facebook: "https://www.facebook.com/kartfreedom",
  youtube: "https://youtube.com/@kartfreedom?si=vv-5BG0lhaCuJBEX",
  tiktok: "https://www.tiktok.com/@kartfreedom.com?_r=1&_t=ZS-94nFBCUGUMb",
};

export const SOCIAL_LINK_META: Array<{
  key: SocialLinkKey;
  label: string;
  tag: string;
}> = [
  { key: "telegram", label: "Telegram", tag: "TG" },
  { key: "instagram", label: "Instagram", tag: "IG" },
  { key: "facebook", label: "Facebook", tag: "FB" },
  { key: "youtube", label: "YouTube", tag: "YT" },
  { key: "tiktok", label: "TikTok", tag: "TT" },
];

export function normalizeSocialLinks(
  input?: Partial<SocialLinks> | null,
): SocialLinks {
  return {
    telegram:
      typeof input?.telegram === "string" && input.telegram.trim()
        ? input.telegram.trim()
        : SOCIAL_LINK_DEFAULTS.telegram,
    instagram:
      typeof input?.instagram === "string" && input.instagram.trim()
        ? input.instagram.trim()
        : SOCIAL_LINK_DEFAULTS.instagram,
    facebook:
      typeof input?.facebook === "string" && input.facebook.trim()
        ? input.facebook.trim()
        : SOCIAL_LINK_DEFAULTS.facebook,
    youtube:
      typeof input?.youtube === "string" && input.youtube.trim()
        ? input.youtube.trim()
        : SOCIAL_LINK_DEFAULTS.youtube,
    tiktok:
      typeof input?.tiktok === "string" && input.tiktok.trim()
        ? input.tiktok.trim()
        : SOCIAL_LINK_DEFAULTS.tiktok,
  };
}
