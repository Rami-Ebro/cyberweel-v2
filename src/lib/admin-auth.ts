import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions";

export const ADMIN_SESSION_COOKIE = "cw_admin_session";

export const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const REMEMBERED_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

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
    timingSafeEqual(aBuffer, aBuffer);
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

export function createSessionToken(ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Date.now() + ttlSeconds * 1000;
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

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) return true;

  const unifiedSession = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
  if (!unifiedSession) return false;

  const user = await db.user.findUnique({
    where: { id: unifiedSession.userId },
    select: {
      role: true,
      isActive: true,
      adminProfile: { select: { isActive: true } },
    },
  });

  return Boolean(
    user?.role === "ADMIN" &&
      user.isActive &&
      user.adminProfile?.isActive !== false,
  );
}

export type AdminShellAccess = {
  isOwner: boolean;
  permissions: string[];
};

export async function getAdminShellAccess(): Promise<AdminShellAccess | null> {
  const cookieStore = await cookies();

  // The legacy signed admin cookie represents the historical owner session.
  if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return { isOwner: true, permissions: [...ADMIN_PERMISSIONS] };
  }

  const unifiedSession = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
  if (!unifiedSession) return null;

  const user = await db.user.findUnique({
    where: { id: unifiedSession.userId },
    select: {
      role: true,
      isActive: true,
      adminProfile: {
        select: { isOwner: true, isActive: true, permissions: true },
      },
    },
  });

  if (!user || user.role !== "ADMIN" || !user.isActive) return null;
  if (user.adminProfile?.isActive === false) return null;
  if (!user.adminProfile) return { isOwner: false, permissions: [] };

  return {
    isOwner: user.adminProfile.isOwner,
    permissions: user.adminProfile.isOwner
      ? [...ADMIN_PERMISSIONS]
      : user.adminProfile.permissions.filter((permission) =>
          ADMIN_PERMISSIONS.includes(permission as (typeof ADMIN_PERMISSIONS)[number]),
        ),
  };
}

export async function requireAdminShellAccess(): Promise<AdminShellAccess> {
  const access = await getAdminShellAccess();
  if (!access) redirect("/login");
  return access;
}

export async function isOwnerSession(): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) return true;

  const unifiedSession = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
  if (!unifiedSession) return false;
  const user = await db.user.findUnique({
    where: { id: unifiedSession.userId },
    select: {
      email: true,
      role: true,
      isActive: true,
      adminProfile: { select: { isOwner: true, isActive: true } },
    },
  });
  if (
    !user ||
    user.role !== "ADMIN" ||
    !user.isActive ||
    user.adminProfile?.isActive === false
  ) {
    return false;
  }
  return user.adminProfile?.isOwner === true;
}

export async function hasAdminPermission(permission: string): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) return true;

  const unifiedSession = readPartnerSession(
    cookieStore.get(PARTNER_SESSION_COOKIE)?.value,
  );
  if (!unifiedSession) return false;
  const user = await db.user.findUnique({
    where: { id: unifiedSession.userId },
    select: {
      role: true,
      isActive: true,
      adminProfile: {
        select: { isOwner: true, isActive: true, permissions: true },
      },
    },
  });
  return Boolean(
    user?.role === "ADMIN" &&
      user.isActive &&
      user.adminProfile?.isActive &&
      (user.adminProfile.isOwner ||
        user.adminProfile.permissions.includes(permission)),
  );
}

export async function requireOwner(): Promise<void> {
  if (!(await isOwnerSession())) {
    redirect("/login");
  }
}

export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    redirect("/login");
  }
}

export async function requireAdminPermission(permission: string): Promise<void> {
  if (!(await hasAdminPermission(permission))) {
    redirect("/login");
  }
}

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
