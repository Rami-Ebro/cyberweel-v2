import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

export async function GET(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const notifications = await db.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  const unread = await db.adminNotification.count({ where: { readAt: null } });
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const access = await currentAdminAccess(request);
  if (!access) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const readAt = new Date();
  if (body?.all === true) {
    await db.adminNotification.updateMany({ where: { readAt: null }, data: { readAt } });
  } else if (typeof body?.id === "string") {
    await db.adminNotification.updateMany({ where: { id: body.id, readAt: null }, data: { readAt } });
  } else {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, readAt });
}
