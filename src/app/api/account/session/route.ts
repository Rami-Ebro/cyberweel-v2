import { NextRequest, NextResponse } from "next/server";
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
      role: true,
      clientEnabled: true,
      isActive: true,
      partner: { select: { status: true } },
      ambassador: { select: { status: true } },
      adminProfile: { select: { isActive: true } },
    },
  });

  if (!user) return NextResponse.json({ authenticated: false });
  if (!user.isActive) return NextResponse.json({ authenticated: false });
  if (user.role === "ADMIN" && user.adminProfile && !user.adminProfile.isActive) {
    return NextResponse.json({ authenticated: false });
  }

  const dashboardLinks = [
    ...(user.role === "ADMIN" || user.adminProfile?.isActive
      ? [{ capability: "ADMIN", label: "الإدارة", url: "/admin/partners" }]
      : []),
    ...(user.role === "CLIENT" || user.clientEnabled
      ? [{ capability: "CLIENT", label: "العميل", url: "/client/dashboard" }]
      : []),
    ...(user.partner?.status === "ACTIVE"
      ? [{ capability: "PARTNER", label: "شريك التنفيذ", url: "/partner/dashboard" }]
      : []),
    ...(user.ambassador?.status === "ACTIVE"
      ? [{ capability: "AMBASSADOR", label: "السفير", url: "/ambassador/dashboard" }]
      : []),
  ];

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
