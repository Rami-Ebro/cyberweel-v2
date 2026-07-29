import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

function referralCode(value: number) {
  return `CW-${String(value).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      partner: {
        select: {
          id: true,
          status: true,
          referralNumber: true,
          createdAt: true,
          assignments: { orderBy: { createdAt: "desc" } },
          referrals: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!user || user.role !== "PARTNER" || !user.partner || user.partner.status !== "ACTIVE") {
    return NextResponse.json({ error: "الحساب غير متاح" }, { status: 403 });
  }

  const code = referralCode(user.partner.referralNumber);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  return NextResponse.json({
    partner: {
      name: user.name || "شريك CyberWeel",
      email: user.email,
      code,
      referralUrl: `${origin}/ref/${code}`,
      joinedAt: user.partner.createdAt,
    },
    stats: {
      referrals: user.partner.referrals.length,
      projects: user.partner.assignments.filter((item) => item.status !== "COMPLETED").length,
      totalCommissions: 0,
      dueBalance: 0,
    },
    referrals: user.partner.referrals,
    projects: user.partner.assignments,
    commissions: [],
    payments: [],
  });
}
