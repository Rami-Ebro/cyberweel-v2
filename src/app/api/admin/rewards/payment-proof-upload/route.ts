import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";

export const runtime = "nodejs";

const MAX_PAYMENT_PROOF_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf"]);

async function requireRewardsAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("rewards"))) return null;
  return access;
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "payment-proof";
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  if (!(await requireRewardsAdmin(request))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) return NextResponse.json({ error: "خدمة رفع الملفات غير مهيأة حاليًا" }, { status: 503 });

  try {
    const form = await request.formData();
    const rewardId = String(form.get("rewardId") || "").trim();
    const file = form.get("file");

    if (!rewardId || !(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "ملف إثبات الدفع مطلوب" }, { status: 400 });
    }
    if (file.size > MAX_PAYMENT_PROOF_SIZE) {
      return NextResponse.json({ error: "حجم مرفق إثبات الدفع يجب ألا يتجاوز 4 MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "صيغة المرفق غير مدعومة. استخدم PNG أو JPG أو WebP أو PDF" }, { status: 400 });
    }

    const reward = await db.ambassadorReward.findUnique({
      where: { id: rewardId },
      select: { status: true },
    });
    if (!reward || !["EARNED", "PAID"].includes(reward.status)) {
      return NextResponse.json({ error: "المكافأة غير مؤهلة لإرفاق إثبات دفع" }, { status: 409 });
    }

    const blob = await put(
      `ambassador-rewards/${rewardId}/proof/${safeFileName(file.name)}`,
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
    console.error("[reward-payment-proof-upload] failed", error);
    return NextResponse.json({ error: "تعذر رفع مرفق إثبات الدفع" }, { status: 500 });
  }
}
