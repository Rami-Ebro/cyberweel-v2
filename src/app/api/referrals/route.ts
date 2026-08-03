import { db } from "@/lib/db";
import { parsePartnerReferralCode } from "@/lib/partner-referral";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE = "cyberweel_partner_referral";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const rateLimit = await consumeRateLimit(request, {
    action: "partner-referral",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const explicitCode = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
  const ambassadorMatch = /^CWA-(\d{4,})$/i.exec(explicitCode);
  const ambassadorReferralNumber = ambassadorMatch ? Number.parseInt(ambassadorMatch[1], 10) : null;
  const explicitReferralNumber = explicitCode ? parsePartnerReferralCode(explicitCode) : null;
  const partnerId = request.cookies.get(REFERRAL_COOKIE)?.value;

  if (
    !name ||
    name.length > 120 ||
    email.length > 254 ||
    phone.length > 40 ||
    notes.length > 5000 ||
    explicitCode.length > 80 ||
    (!email && !phone) ||
    !notes
  ) {
    return NextResponse.json({ error: "أدخل الاسم ووسيلة تواصل واشرح المشكلة أو الفكرة" }, { status: 400 });
  }

  try {
    const ambassador = ambassadorReferralNumber
      ? await db.ambassador.findFirst({ where: { referralNumber: ambassadorReferralNumber, status: "ACTIVE" }, select: { id: true } })
      : null;
    const partner = ambassadorReferralNumber ? null : explicitReferralNumber
      ? await db.partner.findFirst({
          where: { referralNumber: explicitReferralNumber, status: "ACTIVE" },
          select: { id: true },
        })
      : partnerId
        ? await db.partner.findFirst({
            where: { id: partnerId, status: "ACTIVE" },
            select: { id: true },
          })
        : null;

    if (explicitCode && !partner && !ambassador) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REFERRAL_CODE" },
        { status: 400 },
      );
    }

    const attributed = Boolean(partner || ambassador);
    const source = ambassador ? "AMBASSADOR" : partner ? "PARTNER" : "DIRECT";
    const contactMethod = email && phone
      ? "البريد الإلكتروني والهاتف"
      : email
        ? "البريد الإلكتروني"
        : "الهاتف";

    const referral = await db.partnerReferral.create({
      data: {
        partnerId: partner?.id || null,
        ambassadorId: ambassador?.id || null,
        name,
        email: email || null,
        phone: phone || null,
        notes,
        sourcePath: "/share-challenge",
        source,
        contactMethod,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, attributed, referralId: referral.id }, { status: 201 });
  } catch (error) {
    console.error("[referrals] Failed to create partner referral", {
      explicitCode: explicitCode || null,
      hasCookie: Boolean(partnerId),
      error,
    });

    return NextResponse.json({ error: "تعذر تسجيل الإحالة" }, { status: 500 });
  }
}
