import { db } from "@/lib/db";
import { hashPassword, normalizeEmail } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-admin-key");
  if (!process.env.PARTNER_ADMIN_KEY || key !== process.env.PARTNER_ADMIN_KEY) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "مالك CyberWeel";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || password.length < 8) {
    return NextResponse.json({ error: "أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل" }, { status: 400 });
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
