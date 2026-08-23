import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf"]);

type UploadPayload = {
  rewardId: string;
  originalName: string;
  size: number;
};

function parsePayload(value: string | null): UploadPayload | null {
  try {
    const parsed = JSON.parse(value || "");
    if (
      typeof parsed?.rewardId !== "string" ||
      typeof parsed?.originalName !== "string" ||
      typeof parsed?.size !== "number"
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function requireRewardsAdmin(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("rewards"))) return null;
  return access;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "طلب رفع غير صالح" }, { status: 400 });

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    return NextResponse.json({ error: "خدمة رفع الملفات غير مهيأة حاليًا" }, { status: 503 });
  }

  try {
    const response = await handleUpload({
      token: blobToken,
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await requireRewardsAdmin(request))) throw new Error("غير مصرح");

        const payload = parsePayload(clientPayload);
        const extension = payload?.originalName.split(".").pop()?.toLowerCase() || "";
        if (
          !payload ||
          payload.size <= 0 ||
          payload.size > MAX_PAYMENT_PROOF_SIZE ||
          !ALLOWED_EXTENSIONS.has(extension) ||
          !pathname.startsWith(`ambassador-rewards/${payload.rewardId}/proof/`)
        ) {
          throw new Error("ملف إثبات الدفع غير صالح");
        }

        const reward = await db.ambassadorReward.findUnique({
          where: { id: payload.rewardId },
          select: { status: true },
        });
        if (!reward || !["EARNED", "PAID"].includes(reward.status)) {
          throw new Error("المكافأة غير مؤهلة لإرفاق إثبات دفع");
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_PAYMENT_PROOF_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async () => {
        // The Blob URL is attached to the reward payment-proof record
        // when the admin confirms the payment form.
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع إثبات الدفع";
    return NextResponse.json({ error: message }, { status: message === "غير مصرح" ? 403 : 400 });
  }
}
