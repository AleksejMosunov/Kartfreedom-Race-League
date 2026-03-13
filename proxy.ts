import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  getAdminAuthConfig,
  isValidAdminSession,
  sanitizeNextPath,
} from "@/lib/auth";

function isProtectedRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return true;
  }

  const isWriteMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (!isWriteMethod) {
    return false;
  }

  return (
    pathname.startsWith("/api/pilots") ||
    pathname.startsWith("/api/teams") ||
    pathname.startsWith("/api/stages") ||
    pathname.startsWith("/api/regulations") ||
    pathname.startsWith("/api/championships")
  );
}

function unauthorizedPageResponse(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    sanitizeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
  );
  return NextResponse.redirect(loginUrl);
}

function unauthorizedApiResponse() {
  return NextResponse.json(
    { error: "Admin authorization required" },
    { status: 401 },
  );
}

export async function proxy(request: NextRequest) {
  if (!isProtectedRequest(request)) {
    return NextResponse.next();
  }

  try {
    getAdminAuthConfig();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Authentication configuration error";
    return request.nextUrl.pathname.startsWith("/api/")
      ? NextResponse.json({ error: message }, { status: 500 })
      : new NextResponse(message, { status: 500 });
  }

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthorized = await isValidAdminSession(sessionToken);

  if (!isAuthorized) {
    return request.nextUrl.pathname.startsWith("/api/")
      ? unauthorizedApiResponse()
      : unauthorizedPageResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/pilots/:path*",
    "/api/teams/:path*",
    "/api/stages/:path*",
    "/api/regulations/:path*",
    "/api/championships/:path*",
  ],
};
