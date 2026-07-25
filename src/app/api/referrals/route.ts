import { db } from "@/lib/db";
import { parsePartnerReferralCode } from "@/lib/partner-referral";
import { NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE = "cyberweel_partner_referral";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const explicitCode = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
  const explicitReferralNumber = explicitCode ? parsePartnerReferralCode(explicitCode) : null;
  const partnerId = request.cookies.get(REFERRAL_COOKIE)?.value;

  if (!name || (!email && !phone) || !notes) {
    return NextResponse.json({ error: "أدخل الاسم ووسيلة تواصل واشرح المشكلة أو الفكرة" }, { status: 400 });
  }

  try {
    const partner = explicitReferralNumber
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

    if (!partner) {
      return NextResponse.json({ ok: true, attributed: false });
    }

    const referral = await db.partnerReferral.create({
      data: {
        partnerId: partner.id,
        name,
        email: email || null,
        phone: phone || null,
        notes,
        sourcePath: "/share-challenge",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, attributed: true, referralId: referral.id }, { status: 201 });
  } catch (error) {
    console.error("[referrals] Failed to create partner referral", {
      explicitCode: explicitCode || null,
      hasCookie: Boolean(partnerId),
      error,
    });

    return NextResponse.json({ error: "تعذر تسجيل الإحالة" }, { status: 500 });
  }
}
