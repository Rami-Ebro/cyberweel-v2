import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest } from "next/server";

export const ADMIN_PERMISSIONS = [
  "overview",
  "partners",
  "ambassadors",
  "referrals",
  "projects",
  "clients",
  "files",
  "invoices",
  "messages",
  "smart_links",
  "team",
  "audit_log",
  "settings",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export async function currentAdminAccess(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      adminProfile: {
        select: { isOwner: true, isActive: true, permissions: true },
      },
    },
  });

  if (!user || user.role !== "ADMIN" || !user.isActive) return null;

  if (user.adminProfile && !user.adminProfile.isActive) return null;

  if (!user.adminProfile) {
    return { userId: user.id, isOwner: false, permissions: [] };
  }

  return {
    userId: user.id,
    isOwner: user.adminProfile.isOwner,
    permissions: user.adminProfile.isOwner ? ([...ADMIN_PERMISSIONS] as string[]) : user.adminProfile.permissions,
  };
}

export async function canAdmin(request: NextRequest, permission: AdminPermission) {
  const access = await currentAdminAccess(request);
  return Boolean(access && (access.isOwner || access.permissions.includes(permission)));
}
