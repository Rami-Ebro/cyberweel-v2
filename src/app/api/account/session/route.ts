import { NextRequest, NextResponse } from "next/server";
import { accountAccessSelect, hasUnifiedAccountAccess, unifiedDashboardLinks } from "@/lib/account-access";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export async function GET(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ authenticated: false });

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ...accountAccessSelect,
    },
  });

  if (!hasUnifiedAccountAccess(user)) return NextResponse.json({ authenticated: false });

  const dashboardLinks = unifiedDashboardLinks(user);
  if (dashboardLinks.length === 0) return NextResponse.json({ authenticated: false });
  const dashboardUrl = dashboardLinks.find((link) => link.capability === user.role)?.url ?? dashboardLinks[0].url;

  return NextResponse.json({
    authenticated: true,
    account: {
      id: user.id,
      name: user.name || "حساب CyberWeel",
      identifier: user.phone || user.email,
      role: user.role,
      dashboardUrl,
      dashboardLinks,
      settingsUrl: "/account/settings",
    },
  });
}
