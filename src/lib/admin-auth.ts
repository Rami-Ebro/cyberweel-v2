import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "cw_admin_session";

export const SESSION_TTL_SECONDS = 12 * 60 * 60;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// TEMPORARY (v1): in-memory rate limiting. Resets on server restart and is
// not shared across multiple instances. Replace with a persistent store if
// the deployment ever scales beyond a single instance.
const loginAttempts = new Map<string, { count: number; windowStart: number }>();

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or too short (minimum 32 characters).",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    // Compare against itself to keep timing behaviour consistent.
    timingSafeEqual(aBuffer, aBuffer);
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(payload.split(".")[0]);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export async function isOwnerSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

/**
 * Shared authorization guard. Throws (via redirect) when the session is
 * missing, invalid, or expired, so callers can NEVER continue past a failed
 * check into validation or database access.
 */
export async function requireOwner(): Promise<void> {
  if (!(await isOwnerSession())) {
    redirect("/admin/login");
  }
}

/**
 * Verifies the owner credentials against environment variables only.
 *
 * ADMIN_OWNER_PASSWORD_HASH format: "<salt-hex>:<scrypt-hash-hex>" (64-byte
 * scrypt). Generate it locally (never commit the output):
 *
 *   node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" 'your-password'
 */
export function verifyOwnerCredentials(email: string, password: string): boolean {
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL;
  const passwordHash = process.env.ADMIN_OWNER_PASSWORD_HASH;
  if (!ownerEmail || !passwordHash) return false;

  const emailMatches = safeEqual(email.toLowerCase(), ownerEmail.toLowerCase());

  const [salt, storedHex] = passwordHash.split(":");
  if (!salt || !storedHex) return false;

  let passwordMatches = false;
  try {
    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(storedHex, "hex");
    passwordMatches =
      stored.length === derived.length && timingSafeEqual(derived, stored);
  } catch {
    passwordMatches = false;
  }

  return emailMatches && passwordMatches;
}

export async function getClientKey(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

export function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(clientKey);
  if (!entry || now - entry.windowStart > ATTEMPT_WINDOW_MS) return false;
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

export function recordFailedAttempt(clientKey: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(clientKey);
  if (!entry || now - entry.windowStart > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(clientKey, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(clientKey: string): void {
  loginAttempts.delete(clientKey);
}
