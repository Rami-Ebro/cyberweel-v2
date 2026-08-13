import QRCode from "qrcode";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { currentAmbassador } from "@/lib/ambassador-auth";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { formatAmbassadorReferralCode } from "@/lib/partner-referral";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const previewId = request.nextUrl.searchParams.get("adminPreview");
  const sessionUser = previewId ? null : await currentAmbassador(request);
  const ambassador = previewId && await canAdmin(request, "ambassadors")
    ? await db.ambassador.findUnique({
        where: { id: previewId },
        select: { id: true, referralNumber: true, profileCompletedAt: true },
      })
    : sessionUser?.ambassador;

  if (!ambassador) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });
  if (!previewId && !ambassador.profileCompletedAt) {
    return NextResponse.json({ error: "PROFILE_REQUIRED" }, { status: 428 });
  }

  const code = formatAmbassadorReferralCode(ambassador.referralNumber);
  const referralUrl = `${request.nextUrl.origin}/?ref=${encodeURIComponent(code)}`;

  try {
    const qr = await QRCode.toBuffer(referralUrl, {
      type: "png",
      width: 1000,
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#111827", light: "#FFFFFF" },
    });

    const brandedQr = await sharp({
      create: { width: 1120, height: 1120, channels: 4, background: "#B89A5A" },
    })
      .composite([{ input: qr, left: 60, top: 60 }])
      .png()
      .toBuffer();

    const download = request.nextUrl.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(brandedQr), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="cyberweel-${code.toLowerCase()}-qr.png"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[ambassador-qr] QR generation failed", {
      ambassadorId: ambassador.id,
      cause: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "تعذّر إنشاء رمز QR حاليًا" }, { status: 502 });
  }
}
