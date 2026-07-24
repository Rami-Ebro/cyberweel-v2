import { db } from "@/lib/db";
import { hashPassword, normalizeEmail } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "بيانات التسجيل غير مكتملة" }, { status: 400 });
  }

  const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "البريد مستخدم مسبقًا" }, { status: 409 });

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "PARTNER",
      partner: { create: { status: "PENDING" } },
    },
  });

  return NextResponse.json({ ok: true, status: "PENDING" }, { status: 201 });
}
