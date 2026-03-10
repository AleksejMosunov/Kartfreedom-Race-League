export const AUTH_COOKIE_NAME = "kartfreedom_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getAdminAuthConfig() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminUsername || !adminPassword || !sessionSecret) {
    throw new Error(
      "Не настроены ADMIN_USERNAME, ADMIN_PASSWORD и ADMIN_SESSION_SECRET",
    );
  }

  return { adminUsername, adminPassword, sessionSecret };
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createAdminSessionToken() {
  const { adminUsername, adminPassword, sessionSecret } = getAdminAuthConfig();
  return sha256(`${adminUsername}:${adminPassword}:${sessionSecret}`);
}

export async function isValidAdminSession(token: string | undefined) {
  if (!token) {
    return false;
  }

  const expectedToken = await createAdminSessionToken();
  return token === expectedToken;
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/admin";
  }

  return nextPath;
}
