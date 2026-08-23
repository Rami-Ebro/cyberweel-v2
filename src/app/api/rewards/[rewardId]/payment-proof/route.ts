import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { currentAmbassador } from "@/lib/ambassador-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const PAYMENT_PROOF_PREFIX = "PAYMENT_PROOF:";
type RouteContext = { params: Promise<{ rewardId: string }> };

type StoredProof = {
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};

function proofFromNotes(value: string | null) {
  if (!value?.startsWith(PAYMENT_PROOF_PREFIX)) return null;
  try {
    return JSON.parse(value.slice(PAYMENT_PROOF_PREFIX.length)) as StoredProof;
  } catch {
    return null;
  }
}

function safeName(value: string | null | undefined) {
  return (value || "payment-proof").replace(/[\r\n\"]/g, "").trim().slice(0, 180) || "payment-proof";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rewardId } = await context.params;
  const reward = await db.ambassadorReward.findUnique({
    where: { id: rewardId },
    select: { ambassadorId: true, adminNotes: true },
  });
  if (!reward) return NextResponse.json({ error: "إثبات الدفع غير موجود" }, { status: 404 });

  const [admin, ambassador] = await Promise.all([
    currentAdminAccess(request),
    currentAmbassador(request),
  ]);
  const adminAllowed = Boolean(admin && (admin.isOwner || admin.permissions.includes("rewards")));
  const ambassadorAllowed = ambassador?.ambassador?.id === reward.ambassadorId;
  if (!adminAllowed && !ambassadorAllowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const proof = proofFromNotes(reward.adminNotes);
  if (!proof?.attachmentUrl) return NextResponse.json({ error: "لا يوجد مرفق لإثبات الدفع" }, { status: 404 });

  const blob = await get(proof.attachmentUrl, { access: "private" });
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || "application/octet-stream",
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName(proof.attachmentName))}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
      ETag: blob.blob.etag,
    },
  });
}
