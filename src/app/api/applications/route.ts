import { db } from "@/lib/db";
import { consumeRateLimit, hasTrustedOrigin, invalidOriginResponse, rateLimitResponse } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { findNameConflict, NAME_TAKEN_MESSAGE, normalizeDisplayName, normalizeEmail } from "@/lib/user-identity";
import { writeAdminAudit } from "@/lib/admin-audit";

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const limit = await consumeRateLimit(request, { action: "collaboration-application", limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const body = await request.json().catch(() => null);
  const type = body?.type === "AMBASSADOR" ? "AMBASSADOR" : body?.type === "PARTNER" ? "PARTNER" : null;
  const name = typeof body?.name === "string" ? normalizeDisplayName(body.name) : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const specialty = typeof body?.specialty === "string" ? body.specialty.trim() : "";
  const market = typeof body?.market === "string" ? body.market.trim() : "";
  const details = typeof body?.details === "string" ? body.details.trim() : "";
  const countryRegion = typeof body?.countryRegion === "string" ? body.countryRegion.trim() : "";
  const partnerType = typeof body?.partnerType === "string" ? body.partnerType.trim() : "";
  const workAreas = stringList(body?.workAreas);
  const supportServices = stringList(body?.supportServices);
  const experienceLevel = typeof body?.experienceLevel === "string" ? body.experienceLevel.trim() : "";
  const experienceYears = Number(body?.experienceYears);
  const availabilityType = body?.availabilityType === "FULL_TIME" || body?.availabilityType === "PART_TIME" ? body.availabilityType : "";
  const weeklyHours = body?.weeklyHours ? Number(body.weeklyHours) : null;
  const cooperationTypes = stringList(body?.cooperationTypes);
  const shortBio = typeof body?.shortBio === "string" ? body.shortBio.trim() : "";
  const paymentMethods = stringList(body?.paymentMethods);
  const otherPaymentMethod = typeof body?.otherPaymentMethod === "string" ? body.otherPaymentMethod.trim() : "";

  if (
    !type ||
    !name ||
    name.length > 120 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    email.length > 254 ||
    phone.length > 40 ||
    details.length > 5000 ||
    (type === "PARTNER" && (!phone || !countryRegion || !partnerType || !workAreas.length || !supportServices.length || !experienceLevel || !Number.isInteger(experienceYears) || experienceYears < 0 || !availabilityType || (availabilityType === "PART_TIME" && (!weeklyHours || weeklyHours < 1 || weeklyHours > 168)) || !paymentMethods.length || (paymentMethods.includes("أخرى") && !otherPaymentMethod) || shortBio.length > 2000)) ||
    (type === "AMBASSADOR" && !market)
  ) {
    return NextResponse.json({ error: "INVALID_APPLICATION" }, { status: 400 });
  }

  const nameConflict = await findNameConflict(name);
  if (nameConflict) {
    return NextResponse.json({ error: "NAME_TAKEN", message: NAME_TAKEN_MESSAGE }, { status: 409 });
  }

  const application = await db.$transaction(async (tx) => {
    const created = await tx.collaborationApplication.create({
      data: {
        type,
        name,
        email,
        phone: phone || null,
        specialty: type === "PARTNER" ? workAreas.join("، ") : specialty || null,
        market: type === "PARTNER" ? countryRegion : market || null,
        details: type === "PARTNER" ? shortBio || null : details || null,
        countryRegion: type === "PARTNER" ? countryRegion : null,
        partnerType: type === "PARTNER" ? partnerType : null,
        workAreas: type === "PARTNER" ? workAreas : [],
        supportServices: type === "PARTNER" ? supportServices : [],
        experienceLevel: type === "PARTNER" ? experienceLevel : null,
        experienceYears: type === "PARTNER" ? experienceYears : null,
        availabilityType: type === "PARTNER" ? availabilityType : null,
        weeklyHours: type === "PARTNER" ? weeklyHours : null,
        cooperationTypes: type === "PARTNER" ? cooperationTypes : [],
        shortBio: type === "PARTNER" ? shortBio || null : null,
        paymentMethods: type === "PARTNER" ? paymentMethods : [],
        otherPaymentMethod: type === "PARTNER" ? otherPaymentMethod || null : null,
      },
      select: { id: true },
    });
    if (type === "PARTNER") await writeAdminAudit(tx, { action: "PARTNER_APPLICATION_SUBMITTED", category: "NORMAL", entityType: "PARTNER_APPLICATION", entityId: created.id, entityLabel: name, after: { status: "PENDING", reviewState: "NEW" } });
    await tx.adminNotification.create({
      data: {
        title: type === "PARTNER" ? "طلب شريك تنفيذ جديد" : "طلب سفير جديد",
        body: `${name} — ${email}`,
        href: type === "PARTNER" ? "/admin/partners?section=partners" : "/admin/ambassadors",
        kind: type === "PARTNER" ? "PARTNER_APPLICATION" : "AMBASSADOR_APPLICATION",
      },
    });
    return created;
  });

  return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
}
