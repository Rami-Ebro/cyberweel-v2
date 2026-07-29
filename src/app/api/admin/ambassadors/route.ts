import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { hashPassword, normalizeEmail } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "ambassadors"))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const [ambassadors, applications] = await Promise.all([
    db.ambassador.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true, phone: true, isActive: true } }, referrals: { select: { status: true, commissionAmount: true, commissionCurrency: true, commissionStatus: true } } } }),
    db.collaborationApplication.findMany({ where: { type: "AMBASSADOR" }, orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({ ambassadors, applications });
}
export async function PATCH(request: NextRequest) {
  if (!(await canAdmin(request, "ambassadors"))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const body = await request.json().catch(() => null); const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  if (body?.entity === "application") {
    if (!body.id || !["ACCEPTED", "REJECTED"].includes(body.status) || !notes) return NextResponse.json({ error: "INVALID_DECISION" }, { status: 400 });
    const app = await db.collaborationApplication.findUnique({ where: { id: body.id } }); if (!app || app.type !== "AMBASSADOR") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (body.status === "ACCEPTED") { if (typeof body.password !== "string" || body.password.length < 10) return NextResponse.json({ error: "TEMP_PASSWORD_REQUIRED" }, { status: 400 });
      await db.$transaction(async tx => { const user = await tx.user.create({ data: { name: app.name, email: normalizeEmail(app.email), phone: app.phone, passwordHash: hashPassword(body.password), role: "AMBASSADOR", ambassador: { create: { status: "ACTIVE", decisionNotes: notes, decidedAt: new Date() } } } }); await tx.collaborationApplication.update({ where: { id: app.id }, data: { status: "ACCEPTED", decisionNotes: notes, decidedAt: new Date() } }); return user; });
    } else await db.collaborationApplication.update({ where: { id: app.id }, data: { status: "REJECTED", decisionNotes: notes, decidedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  if (!body?.id || !["ACTIVE", "SUSPENDED"].includes(body.status)) return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  const ambassador = await db.ambassador.update({ where: { id: body.id }, data: { status: body.status, decisionNotes: notes || undefined }, include: { user: true } });
  await db.user.update({ where: { id: ambassador.userId }, data: { isActive: body.status === "ACTIVE" } }); return NextResponse.json({ ambassador });
}
