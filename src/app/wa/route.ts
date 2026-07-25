import { db } from "@/lib/db";
import { formatPartnerReferralCode } from "@/lib/partner-referral";
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

  const message = referralCode
    ? `مرحبًا، أرغب في مناقشة مشروعي مع CyberWeel.\nرمز الإحالة: ${referralCode}`
    : "مرحبًا، أرغب في مناقشة مشروعي مع CyberWeel.";

  const whatsappUrl = new URL(`https://wa.me/${WHATSAPP_NUMBER}`);
  whatsappUrl.searchParams.set("text", message);

  const response = NextResponse.redirect(whatsappUrl, 302);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
