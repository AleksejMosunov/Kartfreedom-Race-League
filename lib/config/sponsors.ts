const FALLBACK_SPONSOR_CONTACT_URL = "https://t.me/aleksej_mosunov";

export const SPONSOR_CONTACT_URL =
  process.env.NEXT_PUBLIC_SPONSOR_CONTACT_URL?.trim() ||
  FALLBACK_SPONSOR_CONTACT_URL;
