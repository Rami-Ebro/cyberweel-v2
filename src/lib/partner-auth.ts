import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const PARTNER_SESSION_COOKIE = "cyberweel_partner_session";
const REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const BROWSER_SESSION_MAX_AGE = 60 * 60 * 12;

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be at least 32 characters");
  }
  return value;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createPartnerSession(userId: string, remember = false): string {
  const maxAge = remember ? REMEMBERED_SESSION_MAX_AGE : BROWSER_SESSION_MAX_AGE;
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const nonce = randomBytes(16).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt, nonce })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readPartnerSession(token?: string | null): { userId: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.userId || parsed.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `${hasPlus ? "+" : ""}${digits}` : "";
}

export function phoneIdentityCandidates(value: string): string[] {
  const normalized = normalizePhone(value);
  if (!normalized) return [];

  const digits = normalized.replace(/\D/g, "");
  const candidates = new Set<string>([normalized]);
  if (normalized.startsWith("+")) {
    candidates.add(digits);
    candidates.add(`00${digits}`);
  } else if (digits.startsWith("00") && digits.length > 2) {
    const internationalDigits = digits.slice(2);
    candidates.add(internationalDigits);
    candidates.add(`+${internationalDigits}`);
  } else if (!digits.startsWith("0")) {
    candidates.add(`+${digits}`);
    candidates.add(`00${digits}`);
  }

  return [...candidates];
}

export function safeRedirectPath(value: unknown, fallback = "/partner/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function partnerSessionCookieOptions(remember = false) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high" as const,
    ...(remember ? { maxAge: REMEMBERED_SESSION_MAX_AGE } : {}),
  };
}

export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
