import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const client = await db.user.findFirst({
    where: { id: session.userId, role: "CLIENT", isActive: true },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const notificationId = typeof body?.notificationId === "string" ? body.notificationId : "";
  if (!notificationId) {
    return NextResponse.json({ error: "معرّف الإشعار مطلوب" }, { status: 400 });
  }

  await db.clientNotification.updateMany({
    where: { id: notificationId, clientId: client.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
