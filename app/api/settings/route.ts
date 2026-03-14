import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { LeagueSettings } from "@/lib/models/LeagueSettings";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";
import { normalizeSocialLinks, SocialLinks } from "@/lib/socialLinks";

const SETTINGS_KEY = "global";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "organizer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const settings = await LeagueSettings.findOne({ key: SETTINGS_KEY })
    .select({ alertChatId: 1, socialLinks: 1 })
    .lean();
  return NextResponse.json({
    alertChatId: settings?.alertChatId ?? "",
    socialLinks: normalizeSocialLinks(
      settings?.socialLinks as Partial<SocialLinks> | undefined,
    ),
  });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "organizer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectToDatabase();
  const body = (await req.json().catch(() => ({}))) as {
    alertChatId?: string;
    socialLinks?: Partial<SocialLinks>;
  };
  const alertChatId =
    typeof body.alertChatId === "string" ? body.alertChatId.trim() : "";
  const socialLinks = normalizeSocialLinks(body.socialLinks);

  await LeagueSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { alertChatId, socialLinks } },
    { upsert: true, new: true },
  ).lean();

  return NextResponse.json({ alertChatId, socialLinks });
}
