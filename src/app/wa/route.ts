import { db } from "@/lib/db";
import { formatPartnerReferralCode, parsePartnerReferralCode } from "@/lib/partner-referral";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REFERRAL_COOKIE = "cyberweel_partner_referral";
const WHATSAPP_NUMBER = "963982799800";

export async function GET(request: NextRequest) {
  const partnerId = request.cookies.get(REFERRAL_COOKIE)?.value;
  let referralCode: string | null = null;

  if (partnerId) {
    const partner = await db.partner.findFirst({
      where: { id: partnerId, status: "ACTIVE" },
      select: { referralNumber: true },
    });

    if (partner) {
      referralCode = formatPartnerReferralCode(partner.referralNumber);
    }
  }

  if (!referralCode) {
    const referer = request.headers.get("referer");

    if (referer) {
      const code = new URL(referer).searchParams.get("ref");
      const referralNumber = code ? parsePartnerReferralCode(code) : null;

      if (referralNumber) {
        const partner = await db.partner.findFirst({
          where: { referralNumber, status: "ACTIVE" },
          select: { referralNumber: true },
        });

        if (partner) {
          referralCode = formatPartnerReferralCode(partner.referralNumber);
        }
      }
    }
  }

  const message = referralCode
    ? `مرحبًا، أرغب في مناقشة مشروعي مع CyberWeel.\nرمز الإحالة: ${referralCode}`
    : "مرحبًا، أرغب في مناقشة مشروعي مع CyberWeel.";

  const whatsappUrl = new URL("https://api.whatsapp.com/send");
  whatsappUrl.searchParams.set("phone", WHATSAPP_NUMBER);
  whatsappUrl.searchParams.set("text", message);
  whatsappUrl.searchParams.set("app_absent", "0");

  const response = NextResponse.redirect(whatsappUrl, 302);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
