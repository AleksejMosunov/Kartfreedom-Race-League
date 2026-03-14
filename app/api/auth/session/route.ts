import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthenticatedAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(token);
  return NextResponse.json({
    authenticated: Boolean(session),
    role: session?.role ?? null,
    userId: session?.userId ?? null,
    username: session?.username ?? null,
  });
}
