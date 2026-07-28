import { db } from "@/lib/db";
import { hashPassword, normalizeEmail } from "@/lib/partner-auth";
import {
  consumeRateLimit,
  hasTrustedOrigin,
  invalidOriginResponse,
  rateLimitResponse,
  safeSecretEqual,
} from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  if (process.env.ADMIN_SETUP_ENABLED !== "true") {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const rateLimit = await consumeRateLimit(request, {
    action: "admin-setup",
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const key = request.headers.get("x-admin-key");
  if (!safeSecretEqual(key, process.env.PARTNER_ADMIN_KEY)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const existingOwner = await db.adminProfile.findFirst({
    where: { isOwner: true },
    select: { id: true },
  });
  if (existingOwner) {
    return NextResponse.json(
      { error: "تمت تهيئة حساب المالك مسبقًا" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "مالك CyberWeel";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const configuredOwnerEmail = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();

  if (
    !email.includes("@") ||
    email.length > 254 ||
    name.length < 2 ||
    name.length > 120 ||
    password.length < 12 ||
    password.length > 256 ||
    (configuredOwnerEmail && email !== configuredOwnerEmail)
  ) {
    return NextResponse.json({ error: "بيانات حساب المالك غير صالحة" }, { status: 400 });
  }

  const admin = await db.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
      passwordHash: hashPassword(password),
      adminProfile: {
        upsert: {
          create: { isOwner: true, isActive: true },
          update: { isOwner: true, isActive: true },
        },
      },
    },
    create: {
      name,
      email,
      role: "ADMIN",
      passwordHash: hashPassword(password),
      adminProfile: { create: { isOwner: true, isActive: true } },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, admin });
}
