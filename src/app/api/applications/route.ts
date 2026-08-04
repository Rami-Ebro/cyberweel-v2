import { db } from "@/lib/db";
import { consumeRateLimit, hasTrustedOrigin, invalidOriginResponse, rateLimitResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const limit = await consumeRateLimit(request, { action: "collaboration-application", limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);
  const body = await request.json().catch(() => null);
  const type = body?.type === "AMBASSADOR" ? "AMBASSADOR" : body?.type === "PARTNER" ? "PARTNER" : null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const specialty = typeof body?.specialty === "string" ? body.specialty.trim() : "";
  const market = typeof body?.market === "string" ? body.market.trim() : "";
  const details = typeof body?.details === "string" ? body.details.trim() : "";
  if (!type || !name || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || phone.length > 40 || details.length > 5000 || (type === "PARTNER" && !specialty) || (type === "AMBASSADOR" && !market)) return NextResponse.json({ error: "INVALID_APPLICATION" }, { status: 400 });
  const application = await db.$transaction(async (tx) => {
    const created = await tx.collaborationApplication.create({ data: { type, name, email, phone: phone || null, specialty: specialty || null, market: market || null, details: details || null }, select: { id: true } });
    await tx.adminNotification.create({ data: { title: type === "PARTNER" ? "طلب شريك تنفيذ جديد" : "طلب سفير جديد", body: `${name} — ${email}`, href: type === "PARTNER" ? "/admin/partners?section=partners" : "/admin/ambassadors", kind: type === "PARTNER" ? "PARTNER_APPLICATION" : "AMBASSADOR_APPLICATION" } });
    return created;
  });
  return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
}
