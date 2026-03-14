import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AdminRole,
  getAuthenticatedAdminSession,
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
    pathname.startsWith("/api/championships") ||
    pathname.startsWith("/api/admin-users") ||
    pathname.startsWith("/api/telegram")
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

function forbiddenApiResponse() {
  return NextResponse.json({ error: "Недостатньо прав" }, { status: 403 });
}

function forbiddenPageResponse() {
  return new NextResponse("Доступ заборонено", { status: 403 });
}

function canAccessAdminPage(role: AdminRole, pathname: string) {
  if (role === "organizer") return true;
  if (role === "marshal") {
    return (
      pathname === "/admin/stages" || pathname.startsWith("/admin/stages/")
    );
  }
  return false;
}

function canAccessApi(role: AdminRole, request: NextRequest) {
  if (role === "organizer") return true;

  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (role === "marshal") {
    const isReadRequest = ["GET", "HEAD", "OPTIONS"].includes(method);

    if (isReadRequest) {
      return (
        pathname.startsWith("/api/championships") ||
        pathname.startsWith("/api/stages") ||
        pathname.startsWith("/api/pilots")
      );
    }

    if (method === "POST" && /\/api\/stages\/[^/]+\/results$/.test(pathname)) {
      return true;
    }

    return false;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  if (!isProtectedRequest(request)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(sessionToken);
  const role = session?.role ?? null;

  if (!role) {
    return request.nextUrl.pathname.startsWith("/api/")
      ? unauthorizedApiResponse()
      : unauthorizedPageResponse(request);
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (role === "marshal" && request.nextUrl.pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/stages", request.url));
    }
    if (!canAccessAdminPage(role, request.nextUrl.pathname)) {
      return forbiddenPageResponse();
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!canAccessApi(role, request)) {
      return forbiddenApiResponse();
    }
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
    "/api/admin-users/:path*",
    "/api/telegram/:path*",
  ],
};
