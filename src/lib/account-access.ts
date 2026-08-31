import type { UserRole } from "@prisma/client";

export type AccountAccessSnapshot = {
  role: UserRole;
  clientEnabled: boolean;
  isActive: boolean;
  partner?: { status: string } | null;
  ambassador?: { status: string } | null;
  adminProfile?: { isActive: boolean } | null;
};

export const accountAccessSelect = {
  role: true,
  clientEnabled: true,
  isActive: true,
  partner: { select: { status: true } },
  ambassador: { select: { status: true } },
  adminProfile: { select: { isActive: true } },
} as const;

export function hasUnifiedAccountAccess(user: AccountAccessSnapshot | null | undefined) {
  if (!user?.isActive) return false;
  if (user.role === "ADMIN" && user.adminProfile && !user.adminProfile.isActive) return false;

  return Boolean(
    user.role === "ADMIN" ||
      user.adminProfile?.isActive ||
      user.role === "CLIENT" ||
      user.clientEnabled ||
      user.partner?.status === "ACTIVE" ||
      user.ambassador?.status === "ACTIVE",
  );
}

export function unifiedDashboardLinks(user: AccountAccessSnapshot) {
  if (!hasUnifiedAccountAccess(user)) return [];

  return [
    ...(user.role === "ADMIN" || user.adminProfile?.isActive
      ? [{ capability: "ADMIN" as const, label: "الإدارة", url: "/admin/partners" }]
      : []),
    ...(user.role === "CLIENT" || user.clientEnabled
      ? [{ capability: "CLIENT" as const, label: "العميل", url: "/client/dashboard" }]
      : []),
    ...(user.partner?.status === "ACTIVE"
      ? [{ capability: "PARTNER" as const, label: "شريك التنفيذ", url: "/partner/dashboard" }]
      : []),
    ...(user.ambassador?.status === "ACTIVE"
      ? [{ capability: "AMBASSADOR" as const, label: "السفير", url: "/ambassador/dashboard" }]
      : []),
  ];
}
