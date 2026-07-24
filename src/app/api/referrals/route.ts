import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE = "cyberweel_partner_referral";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const partnerId = request.cookies.get(REFERRAL_COOKIE)?.value;

  if (!name || (!email && !phone)) {
    return NextResponse.json({ error: "أدخل الاسم ووسيلة تواصل واحدة على الأقل" }, { status: 400 });
  }

  if (partnerId) {
    const partner = await db.partner.findFirst({ where: { id: partnerId, status: "ACTIVE" }, select: { id: true } });
    if (partner) {
      await db.partnerReferral.create({
        data: { partnerId: partner.id, name, email: email || null, phone: phone || null, notes: notes || null, sourcePath: "/share-challenge" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
