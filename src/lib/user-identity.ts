import { db } from "@/lib/db";
import type { Prisma, UserRole } from "@prisma/client";
import { normalizeEmail, normalizePhone } from "@/lib/partner-auth";

export const NAME_TAKEN_MESSAGE = "هذا الاسم مستخدم بالفعل، يرجى اختيار اسم آخر.";

export function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

type UserIdentityDb = Pick<typeof db, "user">;

export async function findNameConflict(
  name: string,
  excludeUserId?: string,
  client: UserIdentityDb = db,
) {
  const normalized = normalizeDisplayName(name);
  if (normalized.length < 2) return null;
  const rows = await client.user.findMany({
    where: {
      name: { equals: normalized, mode: "insensitive" },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true, name: true, email: true, role: true },
    take: 1,
  });
  return rows[0] || null;
}

export async function assertNameAvailable(
  name: string,
  excludeUserId?: string,
  client: UserIdentityDb = db,
) {
  const conflict = await findNameConflict(name, excludeUserId, client);
  if (conflict) {
    const error = new Error("NAME_TAKEN") as Error & { code: string };
    error.code = "NAME_TAKEN";
    throw error;
  }
  return normalizeDisplayName(name);
}

export type Capability = "CLIENT" | "PARTNER" | "AMBASSADOR" | "ADMIN";

export function userCapabilities(user: {
  role: UserRole;
  clientEnabled?: boolean;
  partner?: { id: string; status: string } | null;
  ambassador?: { id: string; status: string } | null;
  adminProfile?: { isActive: boolean } | null;
}): Capability[] {
  const caps: Capability[] = [];
  if (user.role === "ADMIN" || user.adminProfile?.isActive) caps.push("ADMIN");
  if (user.partner) caps.push("PARTNER");
  if (user.ambassador) caps.push("AMBASSADOR");
  if (user.role === "CLIENT" || user.clientEnabled) caps.push("CLIENT");
  return caps;
}

export function clientAccessWhere(userId?: string): Prisma.UserWhereInput {
  const access: Prisma.UserWhereInput = {
    OR: [{ role: "CLIENT" }, { clientEnabled: true }],
    isActive: true,
  };
  return userId ? { id: userId, ...access } : access;
}

export { normalizeEmail, normalizePhone };
