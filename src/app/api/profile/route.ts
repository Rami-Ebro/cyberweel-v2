import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

function value(input: unknown, max = 1000) {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

export async function GET(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      role: true,
      partner: {
        select: {
          status: true,
          phone: true,
          specialty: true,
          experience: true,
          availability: true,
          portfolioUrl: true,
        },
      },
      ambassador: {
        select: {
          status: true,
          phone: true,
          country: true,
          contactMethod: true,
          payoutMethod: true,
          payoutDetails: true,
        },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "INVALID_ROLE" }, { status: 403 });
  }

  const requested = request.nextUrl.searchParams.get("capability");
  const role =
    requested === "PARTNER" && user.partner?.status === "ACTIVE"
      ? "PARTNER"
      : requested === "AMBASSADOR" && user.ambassador?.status === "ACTIVE"
        ? "AMBASSADOR"
        : user.role === "PARTNER" && user.partner?.status === "ACTIVE"
          ? "PARTNER"
          : user.role === "AMBASSADOR" && user.ambassador?.status === "ACTIVE"
            ? "AMBASSADOR"
            : user.partner?.status === "ACTIVE"
              ? "PARTNER"
              : user.ambassador?.status === "ACTIVE"
                ? "AMBASSADOR"
                : null;

  if (!role) return NextResponse.json({ error: "INVALID_ROLE" }, { status: 403 });

  return NextResponse.json({
    role,
    profile: role === "AMBASSADOR" ? user.ambassador : user.partner,
  });
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();

  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { partner: true, ambassador: true },
  });
  if (!user?.isActive) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const requested = body?.capability;
  const capability =
    requested === "PARTNER" && user.partner?.status === "ACTIVE"
      ? "PARTNER"
      : requested === "AMBASSADOR" && user.ambassador?.status === "ACTIVE"
        ? "AMBASSADOR"
        : user.role === "PARTNER" && user.partner?.status === "ACTIVE"
          ? "PARTNER"
          : user.role === "AMBASSADOR" && user.ambassador?.status === "ACTIVE"
            ? "AMBASSADOR"
            : null;

  if (capability === "PARTNER" && user.partner) {
    const specialty = value(body?.specialty);
    const experience = value(body?.experience, 5000);
    const availability = value(body?.availability);
    const phone = value(body?.phone, 40);
    if (!specialty || !experience || !availability || !phone) {
      return NextResponse.json({ error: "REQUIRED_FIELDS" }, { status: 400 });
    }
    await db.partner.update({
      where: { id: user.partner.id },
      data: {
        specialty,
        experience,
        availability,
        phone,
        portfolioUrl: value(body?.portfolioUrl, 500) || null,
        profileCompletedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, redirectTo: "/partner/dashboard" });
  }

  if (capability === "AMBASSADOR" && user.ambassador) {
    const phone = value(body?.phone, 40);
    const country = value(body?.country);
    const contactMethod = value(body?.contactMethod);
    const payoutMethod = value(body?.payoutMethod);
    const payoutDetails = value(body?.payoutDetails, 2000);
    if (!phone || !country || !contactMethod || !payoutMethod || !payoutDetails) {
      return NextResponse.json({ error: "REQUIRED_FIELDS" }, { status: 400 });
    }
    await db.ambassador.update({
      where: { id: user.ambassador.id },
      data: {
        phone,
        country,
        contactMethod,
        payoutMethod,
        payoutDetails,
        profileCompletedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, redirectTo: "/ambassador/dashboard" });
  }

  return NextResponse.json({ error: "INVALID_ROLE" }, { status: 403 });
}
