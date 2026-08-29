import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) redirect("/login?next=/account/settings");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      role: true,
      clientEnabled: true,
      isActive: true,
      partner: { select: { status: true } },
      ambassador: { select: { status: true } },
      adminProfile: { select: { isActive: true } },
    },
  });

  const hasAccountAccess = Boolean(
    user?.isActive &&
      !(user.role === "ADMIN" && user.adminProfile && !user.adminProfile.isActive) &&
      (
        user.role === "ADMIN" ||
        user.adminProfile?.isActive ||
        user.role === "CLIENT" ||
        user.clientEnabled ||
        user.partner?.status === "ACTIVE" ||
        user.ambassador?.status === "ACTIVE"
      ),
  );

  if (!hasAccountAccess) redirect("/login?next=/account/settings");

  return children;
}
