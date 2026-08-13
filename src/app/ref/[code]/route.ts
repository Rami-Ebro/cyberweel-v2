import { db } from "@/lib/db";
import {
  formatAmbassadorReferralCode,
  formatPartnerReferralCode,
  parseAmbassadorReferralCode,
  parsePartnerReferralCode,
} from "@/lib/partner-referral";
import {
  LEGACY_PARTNER_REFERRAL_COOKIE,
  REFERRAL_CODE_COOKIE,
  referralCookieOptions,
} from "@/lib/referral-tracking";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const ambassadorReferralNumber = parseAmbassadorReferralCode(code);
  const partnerReferralNumber = ambassadorReferralNumber ? null : parsePartnerReferralCode(code);

  if (!ambassadorReferralNumber && !partnerReferralNumber) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const [ambassador, partner] = await Promise.all([
    ambassadorReferralNumber
      ? db.ambassador.findFirst({
          where: { referralNumber: ambassadorReferralNumber, status: "ACTIVE" },
          select: { id: true },
        })
      : null,
    partnerReferralNumber
      ? db.partner.findFirst({
          where: { referralNumber: partnerReferralNumber, status: "ACTIVE" },
          select: { id: true },
        })
      : null,
  ]);

  if (!partner && !ambassador) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const normalizedCode = ambassadorReferralNumber
    ? formatAmbassadorReferralCode(ambassadorReferralNumber)
    : formatPartnerReferralCode(partnerReferralNumber!);
  const destination = new URL("/", request.url);
  destination.searchParams.set("ref", normalizedCode);
  destination.hash = "/share-challenge";
  const response = NextResponse.redirect(destination, 302);

  response.cookies.set(REFERRAL_CODE_COOKIE, normalizedCode, referralCookieOptions());
  if (partner) {
    response.cookies.set(LEGACY_PARTNER_REFERRAL_COOKIE, partner.id, referralCookieOptions());
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
