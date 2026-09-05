import { db } from "@/lib/db";
import { normalizePhone, phoneIdentityCandidates } from "@/lib/partner-auth";
import { parseAmbassadorReferralCode, parsePartnerReferralCode } from "@/lib/partner-referral";
import { LEGACY_PARTNER_REFERRAL_COOKIE, REFERRAL_CODE_COOKIE } from "@/lib/referral-tracking";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

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
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = rawPhone ? normalizePhone(rawPhone) || rawPhone : "";
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const explicitCode = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
  const storedCode = request.cookies.get(REFERRAL_CODE_COOKIE)?.value?.trim() || "";
  const attributionCode = explicitCode || storedCode;
  const ambassadorReferralNumber = parseAmbassadorReferralCode(attributionCode);
  const partnerReferralNumber = ambassadorReferralNumber ? null : parsePartnerReferralCode(attributionCode);
  const legacyPartnerId = request.cookies.get(LEGACY_PARTNER_REFERRAL_COOKIE)?.value;

  if (
    !name ||
    name.length > 120 ||
    email.length > 254 ||
    phone.length > 40 ||
    company.length > 160 ||
    notes.length > 5000 ||
    attributionCode.length > 80 ||
    (!email && !phone) ||
    !notes
  ) {
    return NextResponse.json({ error: "أدخل الاسم ووسيلة تواصل واشرح المشكلة أو الفكرة" }, { status: 400 });
  }

  try {
    const [emailOwner, phoneOwner] = await Promise.all([
      email
        ? db.user.findUnique({
            where: { email },
            select: { id: true, role: true, clientEnabled: true },
          })
        : null,
      phone
        ? db.user.findFirst({
            where: { phone: { in: phoneIdentityCandidates(phone) } },
            select: { id: true, role: true, clientEnabled: true },
          })
        : null,
    ]);
    const existingClient = [emailOwner, phoneOwner].find(
      (owner) => owner && (owner.role === "CLIENT" || owner.clientEnabled),
    );
    if (existingClient) {
      return NextResponse.json(
        {
          error: "هذا البريد أو رقم الهاتف مرتبط بعميل مسجل بالفعل. استخدم حساب العميل الحالي بدل إنشاء إحالة جديدة.",
          code: "EXISTING_CLIENT",
        },
        { status: 409 },
      );
    }

    const ambassador = ambassadorReferralNumber
      ? await db.ambassador.findFirst({ where: { referralNumber: ambassadorReferralNumber, status: "ACTIVE" }, select: { id: true } })
      : null;
    const partner = ambassadorReferralNumber ? null : partnerReferralNumber
      ? await db.partner.findFirst({
          where: { referralNumber: partnerReferralNumber, status: "ACTIVE" },
          select: { id: true },
        })
      : legacyPartnerId
        ? await db.partner.findFirst({
            where: { id: legacyPartnerId, status: "ACTIVE" },
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
        company: company || null,
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
      hasCookie: Boolean(storedCode || legacyPartnerId),
      error,
    });

    return NextResponse.json({ error: "تعذر تسجيل الإحالة" }, { status: 500 });
  }
}
