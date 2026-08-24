import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assignmentId: string }> };

function safeName(value: string | null | undefined) {
  return (value || "partner-payment-proof").replace(/[\r\n\"]/g, "").trim().slice(0, 180) || "partner-payment-proof";
}

async function currentPartnerId(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, partner: { select: { id: true, status: true } } },
  });
  if (!user?.isActive || !user.partner || user.partner.status !== "ACTIVE") return null;
  return user.partner.id;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { assignmentId } = await context.params;
  const assignment = await getStagePartnerAssignment(assignmentId);
  if (!assignment) return NextResponse.json({ error: "إثبات الدفع غير موجود" }, { status: 404 });

  const [admin, partnerId] = await Promise.all([
    currentAdminAccess(request),
    currentPartnerId(request),
  ]);
  const adminAllowed = Boolean(admin && (admin.isOwner || admin.permissions.includes("projects") || admin.permissions.includes("partners")));
  const partnerAllowed = partnerId === assignment.partnerId;
  if (!adminAllowed && !partnerAllowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  if (!assignment.paymentProofUrl) return NextResponse.json({ error: "لا يوجد مرفق لإثبات الدفع" }, { status: 404 });

  const blob = await get(assignment.paymentProofUrl, { access: "private" });
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || "application/octet-stream",
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName(assignment.paymentProofName))}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      ETag: blob.blob.etag,
    },
  });
}
