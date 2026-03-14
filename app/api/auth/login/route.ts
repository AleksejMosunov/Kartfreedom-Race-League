import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authenticateAdminCredentials,
  createAdminSessionToken,
  ensureBootstrapOrganizerExists,
  getBootstrapOrganizerCredentials,
  getAdminSessionCookieOptions,
} from "@/lib/auth";
import { AdminUser } from "@/lib/models/AdminUser";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    let user = await authenticateAdminCredentials(username, password);

    if (!user) {
      const bootstrap = getBootstrapOrganizerCredentials();
      if (
        bootstrap &&
        username === bootstrap.username &&
        password === bootstrap.password
      ) {
        user = await ensureBootstrapOrganizerExists(username, password);
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    await connectToDatabase();
    await AdminUser.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } },
    );

    const sessionToken = await createAdminSessionToken(
      String(user._id),
      user.role,
    );
    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      sessionToken,
      getAdminSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
