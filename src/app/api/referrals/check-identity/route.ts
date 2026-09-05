import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone, phoneIdentityCandidates } from "@/lib/partner-auth";
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
    action: "referral-identity-check",
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = rawPhone ? normalizePhone(rawPhone) || rawPhone : "";
  const explicitCode = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
  const storedCode = request.cookies.get(REFERRAL_CODE_COOKIE)?.value?.trim() || "";
  const attributionCode = explicitCode || storedCode;
  const ambassadorReferralNumber = parseAmbassadorReferralCode(attributionCode);
  const partnerReferralNumber = ambassadorReferralNumber ? null : parsePartnerReferralCode(attributionCode);
  const legacyPartnerId = request.cookies.get(LEGACY_PARTNER_REFERRAL_COOKIE)?.value;

  if (email.length > 254 || phone.length > 40 || attributionCode.length > 80) {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }

  const ambassador = ambassadorReferralNumber
    ? await db.ambassador.findFirst({
        where: { referralNumber: ambassadorReferralNumber, status: "ACTIVE" },
        select: { id: true },
      })
    : null;
  const partner = ambassadorReferralNumber
    ? null
    : partnerReferralNumber
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

  if (explicitCode && !ambassador && !partner) {
    return NextResponse.json({ ok: false, error: "INVALID_REFERRAL_CODE" }, { status: 400 });
  }

  if (!ambassador && !partner) {
    return NextResponse.json({ ok: true, applicable: false, existingClient: false });
  }

  if (!email && !phone) {
    return NextResponse.json({ ok: true, applicable: true, existingClient: false });
  }

  const [emailOwner, phoneOwner] = await Promise.all([
    email
      ? db.user.findUnique({
          where: { email },
          select: { role: true, clientEnabled: true },
        })
      : null,
    phone
      ? db.user.findFirst({
          where: { phone: { in: phoneIdentityCandidates(phone) } },
          select: { role: true, clientEnabled: true },
        })
      : null,
  ]);

  const existingClient = [emailOwner, phoneOwner].some(
    (owner) => owner && (owner.role === "CLIENT" || owner.clientEnabled),
  );

  return NextResponse.json({
    ok: true,
    applicable: true,
    existingClient,
  });
}
