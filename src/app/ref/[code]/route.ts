import { db } from "@/lib/db";
import { parsePartnerReferralCode } from "@/lib/partner-referral";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REFERRAL_COOKIE = "cyberweel_partner_referral";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const referralNumber = parsePartnerReferralCode(code);

  if (!referralNumber) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const partner = await db.partner.findFirst({
    where: {
      referralNumber,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!partner) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const response = NextResponse.redirect(new URL("/share-challenge", request.url), 302);

  response.cookies.set(REFERRAL_COOKIE, partner.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
