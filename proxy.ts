import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  AdminRole,
  getAuthenticatedAdminSession,
  sanitizeNextPath,
} from "@/lib/auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ALLOWED_CORS_ORIGINS = new Set([
  "https://kartfreedom-race-league.vercel.app",
  "http://localhost:3000",
]);

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

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

function applyResponseHeadersWithCsrf(
  request: NextRequest,
  response: NextResponse,
  csrfToken: string | null,
) {
  const prepared = applyResponseHeaders(request, response);
  if (!csrfToken) {
    return prepared;
  }

  prepared.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return prepared;
}

function isWriteMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

function isAllowedRequestOrigin(request: NextRequest) {
  const sameOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === sameOrigin || ALLOWED_CORS_ORIGINS.has(origin);
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return false;
  }

  try {
    const refererOrigin = new URL(referer).origin;
    return (
      refererOrigin === sameOrigin || ALLOWED_CORS_ORIGINS.has(refererOrigin)
    );
  } catch {
    return false;
  }
}

function createCsrfToken() {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
}

function isValidCsrfRequest(
  request: NextRequest,
  csrfCookieToken: string | undefined,
) {
  if (!csrfCookieToken) {
    return false;
  }

  const csrfHeaderToken = request.headers.get(CSRF_HEADER_NAME);
  if (!csrfHeaderToken) {
    return false;
  }

  return csrfHeaderToken === csrfCookieToken;
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

  // For non-protected requests, add conservative Cache-Control headers
  // for public GET pages to reduce backend load. Skip caching for admin/api/_next.
  if (!isProtectedRequest(request)) {
    const res = NextResponse.next();
    try {
      const path = request.nextUrl.pathname;
      if (
        request.method === "GET" &&
        !path.startsWith("/_next") &&
        !path.startsWith("/api/") &&
        !path.startsWith("/admin") &&
        !path.startsWith("/login") &&
        !path.startsWith("/auth")
      ) {
        res.headers.set(
          "Cache-Control",
          "public, max-age=10, s-maxage=60, stale-while-revalidate=300",
        );
      }
    } catch {
      // ignore header set errors
    }
    return applyResponseHeaders(request, res);
  }

  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await getAuthenticatedAdminSession(sessionToken);
  const role = session?.role ?? null;
  const csrfCookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfTokenToSet = role && !csrfCookieToken ? createCsrfToken() : null;
  const effectiveCsrfToken = csrfCookieToken ?? csrfTokenToSet ?? undefined;

  if (!role) {
    return applyResponseHeadersWithCsrf(
      request,
      request.nextUrl.pathname.startsWith("/api/")
        ? unauthorizedApiResponse()
        : unauthorizedPageResponse(request),
      null,
    );
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (role === "marshal" && request.nextUrl.pathname === "/admin") {
      return applyResponseHeadersWithCsrf(
        request,
        NextResponse.redirect(new URL("/admin/stages", request.url)),
        csrfTokenToSet,
      );
    }
    if (!canAccessAdminPage(role, request.nextUrl.pathname)) {
      return applyResponseHeadersWithCsrf(
        request,
        forbiddenPageResponse(),
        csrfTokenToSet,
      );
    }
    return applyResponseHeadersWithCsrf(
      request,
      NextResponse.next(),
      csrfTokenToSet,
    );
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!canAccessApi(role, request)) {
      return applyResponseHeadersWithCsrf(
        request,
        forbiddenApiResponse(),
        csrfTokenToSet,
      );
    }

    if (isWriteMethod(request.method)) {
      if (!isAllowedRequestOrigin(request)) {
        return applyResponseHeadersWithCsrf(
          request,
          NextResponse.json(
            { error: "Invalid request origin" },
            { status: 403 },
          ),
          csrfTokenToSet,
        );
      }

      if (!isValidCsrfRequest(request, effectiveCsrfToken)) {
        return applyResponseHeadersWithCsrf(
          request,
          NextResponse.json({ error: "CSRF token mismatch" }, { status: 403 }),
          csrfTokenToSet,
        );
      }
    }
  }

  return applyResponseHeadersWithCsrf(
    request,
    NextResponse.next(),
    csrfTokenToSet,
  );
}

export const config = {
  matcher: "/:path*",
};
