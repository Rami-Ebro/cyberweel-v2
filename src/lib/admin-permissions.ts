import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest } from "next/server";

export const ADMIN_PERMISSIONS = [
  "overview",
  "partners",
  "referrals",
  "projects",
  "clients",
  "files",
  "invoices",
  "messages",
  "smart_links",
  "team",
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
      adminProfile: {
        select: { isOwner: true, isActive: true, permissions: true },
      },
    },
  });

  if (!user || user.role !== "ADMIN") return null;

  if (user.adminProfile && !user.adminProfile.isActive) return null;

  const configuredOwnerEmail = "owner@cyberweel.com";
  const isConfiguredOwner = user.email.toLowerCase() === configuredOwnerEmail;

  // Repair the confirmed main owner's profile when upgrading from the legacy login.
  if (isConfiguredOwner) {
    if (!user.adminProfile?.isOwner) {
      await db.adminProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, isOwner: true, isActive: true },
        update: { isOwner: true },
      });
    }
    return { userId: user.id, isOwner: true, permissions: [...ADMIN_PERMISSIONS] as string[] };
  }

  // Existing ADMIN accounts predate AdminProfile and are treated as the main owner.
  if (!user.adminProfile) {
    if (configuredOwnerEmail) {
      return { userId: user.id, isOwner: false, permissions: [] };
    }
    return { userId: user.id, isOwner: true, permissions: [...ADMIN_PERMISSIONS] as string[] };
  }

  if (!user.adminProfile.isOwner) {
    const existingOwner = await db.adminProfile.findFirst({
      where: { isOwner: true },
      select: { userId: true },
    });

    // Repair the original admin account created before owner profiles existed.
    // If no owner is recorded, only the oldest ADMIN account can become owner.
    if (!existingOwner) {
      const oldestAdmin = await db.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (oldestAdmin?.id === user.id) {
        await db.adminProfile.update({
          where: { userId: user.id },
          data: { isOwner: true },
        });
        return { userId: user.id, isOwner: true, permissions: [...ADMIN_PERMISSIONS] as string[] };
      }
    }
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
