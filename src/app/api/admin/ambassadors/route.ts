import { db } from "@/lib/db";
import { canAdmin, currentAdminAccess } from "@/lib/admin-permissions";
import { NextRequest, NextResponse } from "next/server";
import {
  AcceptApplicationError,
  acceptErrorMessage,
  decideCollaborationApplication,
} from "@/lib/accept-collaboration";

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "ambassadors"))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const [ambassadors, applications] = await Promise.all([
    db.ambassador.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true, isActive: true } },
        referrals: {
          select: {
            status: true,
            commissionAmount: true,
            commissionCurrency: true,
            commissionStatus: true,
          },
        },
      },
    }),
    db.collaborationApplication.findMany({
      where: { type: "AMBASSADOR" },
      orderBy: { createdAt: "desc" },
      include: { decidedBy: { select: { name: true, email: true } } },
    }),
  ]);
  return NextResponse.json({ ambassadors, applications });
}

export async function PATCH(request: NextRequest) {
  if (!(await canAdmin(request, "ambassadors"))) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  if (body?.entity === "application") {
    if (!body.id || !["ACCEPTED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ error: "INVALID_DECISION", message: acceptErrorMessage("INVALID_DECISION") }, { status: 400 });
    }
    if (body.status === "REJECTED" && !notes) {
      return NextResponse.json({ error: "NOTES_REQUIRED", message: acceptErrorMessage("NOTES_REQUIRED") }, { status: 400 });
    }

    const access = await currentAdminAccess(request);

    try {
      const result = await decideCollaborationApplication({
        applicationId: body.id,
        type: "AMBASSADOR",
        status: body.status,
        notes,
        password: typeof body.password === "string" ? body.password : "",
        decidedById: access?.userId || null,
      });
      return NextResponse.json({ ok: true, idempotent: Boolean(result.idempotent) });
    } catch (error) {
      if (error instanceof AcceptApplicationError) {
        return NextResponse.json({ error: error.code, message: acceptErrorMessage(error.code) }, { status: error.status });
      }
      throw error;
    }
  }

  if (!body?.id || !["ACTIVE", "SUSPENDED"].includes(body.status)) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }
  const ambassador = await db.ambassador.update({
    where: { id: body.id },
    data: { status: body.status, decisionNotes: notes || undefined },
    include: { user: true },
  });
  await db.user.update({ where: { id: ambassador.userId }, data: { isActive: body.status === "ACTIVE" } });
  return NextResponse.json({ ambassador });
}
