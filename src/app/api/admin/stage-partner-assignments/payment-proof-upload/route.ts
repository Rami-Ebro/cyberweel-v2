import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

export const runtime = "nodejs";

const MAX_PAYMENT_PROOF_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf"]);

async function requireAccess(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("projects") || access.permissions.includes("partners"))) return null;
  return access;
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "partner-payment-proof";
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  if (!(await requireAccess(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) return NextResponse.json({ error: "خدمة رفع الملفات غير مهيأة حاليًا" }, { status: 503 });

  try {
    const form = await request.formData();
    const assignmentId = String(form.get("assignmentId") || "").trim();
    const file = form.get("file");

    if (!assignmentId || !(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "ملف إثبات الدفع مطلوب" }, { status: 400 });
    }
    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      return NextResponse.json({ error: "حجم مرفق إثبات الدفع يجب ألا يتجاوز 4 MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "صيغة المرفق غير مدعومة. استخدم PNG أو JPG أو WebP أو PDF" }, { status: 400 });
    }

    const assignment = await getStagePartnerAssignment(assignmentId);
    if (!assignment || assignment.status !== "COMPLETED" || assignment.paymentStatus !== "APPROVED") {
      return NextResponse.json({ error: "لا يمكن إرفاق إثبات الدفع قبل اعتماد تسليم الشريك واستحقاق المبلغ" }, { status: 409 });
    }

    const blob = await put(
      `partner-stage-payments/${assignmentId}/proof/${safeFileName(file.name)}`,
      file,
      {
        access: "private",
        token: blobToken,
        addRandomSuffix: true,
        contentType: file.type,
      },
    );

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      originalName: file.name,
    });
  } catch (error) {
    console.error("[stage-partner-payment-proof-upload] failed", error);
    return NextResponse.json({ error: "تعذر رفع مرفق إثبات الدفع" }, { status: 500 });
  }
}
