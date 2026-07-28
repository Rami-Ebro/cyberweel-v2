import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "SUSPEND" | "ACTIVATE" | "PASSWORD_RESET" | "SEND";

export type AuditInput = {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  beforeData?: Prisma.InputJsonValue;
  afterData?: Prisma.InputJsonValue;
};

type Actor = {
  id: string | null;
  name: string | null;
  email: string;
  role: string;
};

function requestMetadata(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return {
    ipHash: ip ? createHash("sha256").update(ip).digest("hex") : null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}

async function actorFromRequest(request: NextRequest): Promise<Actor | null> {
  const access = await currentAdminAccess(request);
  if (!access) return null;
  const user = await db.user.findUnique({
    where: { id: access.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
}

async function append(actor: Actor, input: AuditInput, metadata: { ipHash: string | null; userAgent: string | null }) {
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      entityLabel: input.entityLabel || null,
      summary: input.summary,
      beforeData: input.beforeData,
      afterData: input.afterData,
      ipHash: metadata.ipHash,
      userAgent: metadata.userAgent,
    },
  });
}

export async function auditAdminAction(request: NextRequest, input: AuditInput) {
  try {
    const actor = await actorFromRequest(request);
    if (!actor) return;
    await append(actor, input, requestMetadata(request));
  } catch (error) {
    console.error("Failed to append admin audit log", error);
  }
}

export async function auditOwnerServerAction(input: AuditInput) {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const unified = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
    let actor: Actor | null = null;

    if (unified) {
      const user = await db.user.findUnique({
        where: { id: unified.userId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (user?.role === "ADMIN") actor = { id: user.id, name: user.name, email: user.email, role: user.role };
    } else if (verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
      actor = {
        id: null,
        name: "مالك النظام",
        email: process.env.ADMIN_OWNER_EMAIL || "owner@cyberweel.com",
        role: "ADMIN",
      };
    }

    if (!actor) return;
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip");
    await append(actor, input, {
      ipHash: ip ? createHash("sha256").update(ip).digest("hex") : null,
      userAgent: headerStore.get("user-agent")?.slice(0, 500) || null,
    });
  } catch (error) {
    console.error("Failed to append owner audit log", error);
  }
}
