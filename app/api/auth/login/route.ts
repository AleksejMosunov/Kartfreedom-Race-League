import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAdminSessionToken,
  getAdminAuthConfig,
  getAdminSessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    const { adminUsername, adminPassword } = getAdminAuthConfig();
    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    const sessionToken = await createAdminSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      sessionToken,
      getAdminSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка авторизации";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
