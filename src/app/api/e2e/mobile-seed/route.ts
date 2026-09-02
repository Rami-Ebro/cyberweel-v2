import { db } from "@/lib/db";
import { hashPassword } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TOKEN = "cw-mobile-e2e-20260902";
const EMAILS = {
  owner: "e2e-owner@cyberweel.test",
  client: "e2e-client@cyberweel.test",
  partner: "e2e-partner@cyberweel.test",
  ambassador: "e2e-ambassador@cyberweel.test",
} as const;

function forbidden() {
  return NextResponse.json({ error: "not available" }, { status: 404 });
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") return forbidden();
  if (request.nextUrl.searchParams.get("token") !== TOKEN) return forbidden();

  const action = request.nextUrl.searchParams.get("action") ?? "seed";
  const emails = Object.values(EMAILS);

  if (action === "cleanup") {
    await db.user.deleteMany({ where: { email: { in: emails } } });
    return NextResponse.json({ ok: true, cleaned: emails });
  }

  if (action !== "seed") return forbidden();

  const password = `CwE2E-${crypto.randomUUID()}-Aa9!`;
  const passwordHash = hashPassword(password);
  const now = new Date();

  await db.user.upsert({
    where: { email: EMAILS.owner },
    update: {
      name: "E2E Owner",
      role: "ADMIN",
      isActive: true,
      passwordHash,
      adminProfile: {
        upsert: {
          create: { isOwner: true, isActive: true },
          update: { isOwner: true, isActive: true },
        },
      },
    },
    create: {
      email: EMAILS.owner,
      name: "E2E Owner",
      role: "ADMIN",
      isActive: true,
      passwordHash,
      adminProfile: { create: { isOwner: true, isActive: true } },
    },
  });

  await db.user.upsert({
    where: { email: EMAILS.client },
    update: {
      name: "E2E Client",
      role: "CLIENT",
      clientEnabled: true,
      isActive: true,
      passwordHash,
    },
    create: {
      email: EMAILS.client,
      name: "E2E Client",
      role: "CLIENT",
      clientEnabled: true,
      isActive: true,
      passwordHash,
    },
  });

  await db.user.upsert({
    where: { email: EMAILS.partner },
    update: {
      name: "E2E Partner",
      role: "PARTNER",
      isActive: true,
      passwordHash,
      partner: {
        upsert: {
          create: { status: "ACTIVE", profileCompletedAt: now },
          update: { status: "ACTIVE", profileCompletedAt: now },
        },
      },
    },
    create: {
      email: EMAILS.partner,
      name: "E2E Partner",
      role: "PARTNER",
      isActive: true,
      passwordHash,
      partner: { create: { status: "ACTIVE", profileCompletedAt: now } },
    },
  });

  await db.user.upsert({
    where: { email: EMAILS.ambassador },
    update: {
      name: "E2E Ambassador",
      role: "AMBASSADOR",
      isActive: true,
      passwordHash,
      ambassador: {
        upsert: {
          create: { status: "ACTIVE", profileCompletedAt: now },
          update: { status: "ACTIVE", profileCompletedAt: now },
        },
      },
    },
    create: {
      email: EMAILS.ambassador,
      name: "E2E Ambassador",
      role: "AMBASSADOR",
      isActive: true,
      passwordHash,
      ambassador: { create: { status: "ACTIVE", profileCompletedAt: now } },
    },
  });

  return NextResponse.json({
    ok: true,
    password,
    accounts: EMAILS,
  });
}
