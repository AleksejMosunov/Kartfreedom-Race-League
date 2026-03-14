import crypto from "node:crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser, AdminUserRole } from "@/lib/models/AdminUser";

export const AUTH_COOKIE_NAME = "kartfreedom_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AdminRole = AdminUserRole;

interface SessionPayload {
  uid: string;
  role: AdminRole;
  exp: number;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSessionSecret() {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("ADMIN_SESSION_SECRET must be configured");
  }
  return sessionSecret;
}

function signValue(value: string) {
  const secret = getSessionSecret();
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  if (!storedHash.startsWith("scrypt:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const expectedHex = parts[2];
  const derivedHex = crypto.scryptSync(password, salt, 64).toString("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const derived = Buffer.from(derivedHex, "hex");
  if (expected.length !== derived.length) return false;
  return crypto.timingSafeEqual(expected, derived);
}

export function getBootstrapOrganizerCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export async function ensureBootstrapOrganizerExists(
  username: string,
  password: string,
) {
  await connectToDatabase();
  const normalized = username.trim().toLowerCase();
  const existing = await AdminUser.findOne({ username: normalized }).lean();
  if (existing) return existing;

  const created = await AdminUser.create({
    username: normalized,
    passwordHash: hashAdminPassword(password),
    role: "organizer",
    isActive: true,
  });
  return created.toObject();
}

export async function createAdminSessionToken(userId: string, role: AdminRole) {
  const payload: SessionPayload = {
    uid: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(encoded);
  return `${encoded}.${signature}`;
}

function parseSessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const encoded = parts[0];
  const signature = parts[1];
  const expectedSignature = signValue(encoded);
  const signatureBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  if (signatureBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (!parsed.uid || !parsed.role || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!["organizer", "marshal", "editor"].includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function authenticateAdminCredentials(
  username: string | undefined,
  password: string | undefined,
) {
  if (!username || !password) return null;

  await connectToDatabase();
  const normalized = username.trim().toLowerCase();
  const user = await AdminUser.findOne({
    username: normalized,
    isActive: true,
  });
  if (!user) return null;
  if (!verifyAdminPassword(password, user.passwordHash)) return null;
  return user;
}

export async function getAuthenticatedAdminSession(token: string | undefined) {
  if (!token) return null;
  const parsed = parseSessionToken(token);
  if (!parsed) return null;

  await connectToDatabase();
  const user = await AdminUser.findById(parsed.uid)
    .select({ username: 1, role: 1, isActive: 1 })
    .lean();
  if (!user || !user.isActive) return null;

  return {
    userId: String(user._id),
    username: user.username,
    role: user.role as AdminRole,
  };
}

export async function isValidAdminSession(token: string | undefined) {
  const session = await getAuthenticatedAdminSession(token);
  return Boolean(session);
}

export async function getAdminSessionRole(
  token: string | undefined,
): Promise<AdminRole | null> {
  const session = await getAuthenticatedAdminSession(token);
  return session?.role ?? null;
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
