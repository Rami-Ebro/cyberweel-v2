import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export const dynamic = "force-dynamic";

export default async function DashboardEntryPage() {
  const cookieStore = await cookies();
  const session = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);

  if (!session) redirect("/login?next=/dashboard");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true, partner: { select: { status: true, profileCompletedAt: true } }, ambassador: { select: { status: true, profileCompletedAt: true } }, adminProfile: { select: { isActive: true } } },
  });

  if (!user) redirect("/login?next=/dashboard");

  if (user.role === "ADMIN") {
    if (user.adminProfile && !user.adminProfile.isActive) redirect("/login?error=inactive");
    redirect("/admin/partners");
  }

  if (user.role === "CLIENT") redirect("/client/dashboard");

  if (user.role === "AMBASSADOR" && user.ambassador?.status === "ACTIVE") redirect(user.ambassador.profileCompletedAt ? "/ambassador/dashboard" : "/complete-profile");
  if (user.role === "PARTNER" && user.partner?.status === "ACTIVE" && !user.partner.profileCompletedAt) redirect("/complete-profile");
  if (user.partner?.status === "ACTIVE") redirect("/partner/dashboard");
  redirect("/login?error=partner-pending");
}
