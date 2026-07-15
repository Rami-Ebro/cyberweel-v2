import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function qrSourceUrl(targetUrl: string, format: "png" | "svg") {
  const params = new URLSearchParams({
    data: targetUrl,
    size: format === "png" ? "1200x1200" : "800x800",
    format,
    ecc: "H",
    margin: "0",
    qzone: "4",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function fileName(slug: string, format: "png" | "svg") {
  return `cyberweel-${slug}-qr.${format}`;
}

async function loadLogo() {
  return readFile(path.join(process.cwd(), "public", "logo-transparent.png"));
}

export async function GET(request: NextRequest) {
  if (!(await isOwnerSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim().toLowerCase() ?? "";
  const format = request.nextUrl.searchParams.get("format") === "svg" ? "svg" : "png";

  if (!slugPattern.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const targetUrl = `https://www.cyberweel.com/r/${slug}`;

  try {
    const [qrResponse, logo] = await Promise.all([
      fetch(qrSourceUrl(targetUrl, format), { cache: "no-store" }),
      loadLogo(),
    ]);

    if (!qrResponse.ok) {
      throw new Error(`QR provider returned ${qrResponse.status}`);
    }

    const headers = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `inline; filename="${fileName(slug, format)}"`,
    });

    if (format === "svg") {
      const originalSvg = await qrResponse.text();
      const logoData = `data:image/png;base64,${logo.toString("base64")}`;
      const brandedSvg = originalSvg.replace(
        "</svg>",
        `<rect x="320" y="320" width="160" height="160" rx="22" fill="#ffffff"/><image href="${logoData}" x="342" y="342" width="116" height="116" preserveAspectRatio="xMidYMid meet"/></svg>`,
      );

      headers.set("Content-Type", "image/svg+xml; charset=utf-8");
      return new NextResponse(brandedSvg, { headers });
    }

    const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());
    const logoSize = 190;
    const logoPanelSize = 250;
    const panel = Buffer.from(
      `<svg width="${logoPanelSize}" height="${logoPanelSize}" xmlns="http://www.w3.org/2000/svg"><rect width="${logoPanelSize}" height="${logoPanelSize}" rx="34" fill="#ffffff"/></svg>`,
    );
    const resizedLogo = await sharp(logo)
      .resize(logoSize, logoSize, { fit: "contain" })
      .png()
      .toBuffer();

    const brandedQr = await sharp(qrBuffer)
      .composite([
        { input: panel, gravity: "center" },
        { input: resizedLogo, gravity: "center" },
      ])
      .png()
      .toBuffer();

    headers.set("Content-Type", "image/png");
    return new NextResponse(new Uint8Array(brandedQr), { headers });
  } catch (error) {
    console.error("QR generation failed", error);
    return NextResponse.json(
      { error: "تعذّر إنشاء رمز QR حاليًا." },
      { status: 502 },
    );
  }
}
