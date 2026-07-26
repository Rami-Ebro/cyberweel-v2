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
      partner: { select: { status: true } },
      adminProfile: { select: { isActive: true } },
    },
  });

  if (!user) return NextResponse.json({ authenticated: false });
  if (user.role === "PARTNER" && user.partner?.status !== "ACTIVE") {
    return NextResponse.json({ authenticated: false });
  }
  if (user.role === "ADMIN" && user.adminProfile && !user.adminProfile.isActive) {
    return NextResponse.json({ authenticated: false });
  }

  const dashboardUrl = user.role === "ADMIN"
    ? "/admin/partners"
    : user.role === "CLIENT"
      ? "/client/dashboard"
      : "/partner/dashboard";

  return NextResponse.json({
    authenticated: true,
    account: {
      id: user.id,
      name: user.name || "حساب CyberWeel",
      identifier: user.phone || user.email,
      role: user.role,
      dashboardUrl,
      settingsUrl: "/account/settings",
    },
  });
}
