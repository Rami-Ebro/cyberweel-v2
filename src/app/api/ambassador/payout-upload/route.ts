import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { currentAmbassador } from "@/lib/ambassador-auth";

export const runtime = "nodejs";

const MAX_PAYOUT_QR_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

type UploadPayload = {
  ambassadorId: string;
  originalName: string;
  size: number;
};

function parsePayload(value: string | null): UploadPayload | null {
  try {
    const parsed = JSON.parse(value || "");
    if (
      typeof parsed?.ambassadorId !== "string" ||
      typeof parsed?.originalName !== "string" ||
      typeof parsed?.size !== "number"
    ) return null;
    return parsed;
  } catch {
    return null;
  }
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
        const user = await currentAmbassador(request);
        if (!user?.ambassador) throw new Error("غير مصرح");

        const payload = parsePayload(clientPayload);
        const extension = payload?.originalName.split(".").pop()?.toLowerCase() || "";
        if (
          !payload ||
          payload.ambassadorId !== user.ambassador.id ||
          payload.size <= 0 ||
          payload.size > MAX_PAYOUT_QR_SIZE ||
          !ALLOWED_EXTENSIONS.has(extension) ||
          !pathname.startsWith(`ambassadors/${user.ambassador.id}/payout/`)
        ) {
          throw new Error("بيانات صورة QR غير صالحة");
        }

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_PAYOUT_QR_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async () => {
        // The final Blob URL is stored with the ambassador payout details
        // when the profile form is submitted. No binary data is stored in Postgres.
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع صورة QR";
    return NextResponse.json({ error: message }, { status: message === "غير مصرح" ? 403 : 400 });
  }
}
