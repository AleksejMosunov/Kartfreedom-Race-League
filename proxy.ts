import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AdminRole,
  getAuthenticatedAdminSession,
  sanitizeNextPath,
} from "@/lib/auth";

const ALLOWED_CORS_ORIGINS = new Set([
  "https://kartfreedom-race-league.vercel.app",
  "http://localhost:3000",
]);

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

function applyCorsHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  response.headers.append("Vary", "Origin");

  if (!origin || !ALLOWED_CORS_ORIGINS.has(origin)) {
    return response;
  }

  const requestedHeaders = request.headers.get(
    "access-control-request-headers",
  );
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    requestedHeaders ?? "Content-Type, Authorization",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function applyResponseHeaders(request: NextRequest, response: NextResponse) {
  return applySecurityHeaders(applyCorsHeaders(request, response));
}

function isProtectedRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return true;
  }

  if (
    pathname.startsWith("/api/audit") ||
    pathname.startsWith("/api/metrics") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/admin-users")
  ) {
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
        pathname.startsWith("/api/pilots") ||
        pathname.startsWith("/api/teams") ||
        pathname.startsWith("/api/stages") ||
        pathname.startsWith("/api/regulations") ||
        pathname.startsWith("/api/championships") ||
        pathname.startsWith("/api/admin-users") ||
        pathname.startsWith("/api/telegram") ||
        pathname.startsWith("/api/audit") ||
        pathname === "/api/metrics" ||
        pathname === "/api/settings"
      );
    }
  }

  return false;
}

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    request.method.toUpperCase() === "OPTIONS"
  ) {
    return applyResponseHeaders(
      request,
      new NextResponse(null, { status: 204 }),
    );
  }

  if (!isProtectedRequest(request)) {
    return applyResponseHeaders(request, NextResponse.next());
  }

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(sessionToken);
  const role = session?.role ?? null;

  if (!role) {
    return applyResponseHeaders(
      request,
      request.nextUrl.pathname.startsWith("/api/")
        ? unauthorizedApiResponse()
        : unauthorizedPageResponse(request),
    );
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (role === "marshal" && request.nextUrl.pathname === "/admin") {
      return applyResponseHeaders(
        request,
        NextResponse.redirect(new URL("/admin/stages", request.url)),
      );
    }
    if (!canAccessAdminPage(role, request.nextUrl.pathname)) {
      return applyResponseHeaders(request, forbiddenPageResponse());
    }
    return applyResponseHeaders(request, NextResponse.next());
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!canAccessApi(role, request)) {
      return applyResponseHeaders(request, forbiddenApiResponse());
    }
  }

  return applyResponseHeaders(request, NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
