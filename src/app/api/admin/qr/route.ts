import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const panelWidthRatio = 0.33;
const panelHeightRatio = 0.24;
const logoWidthRatio = 0.72;
const logoHeightRatio = 0.72;

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
  return readFile(path.join(process.cwd(), "public", "cyberweel-logo-qr.svg"));
}

function svgCanvasSize(svg: string) {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
  if (viewBox) {
    const values = viewBox.trim().split(/[ ,]+/).map(Number);
    if (values.length === 4 && values.every(Number.isFinite)) {
      return { width: values[2], height: values[3] };
    }
  }

  const width = Number(svg.match(/\bwidth=["']([\d.]+)/i)?.[1]);
  const height = Number(svg.match(/\bheight=["']([\d.]+)/i)?.[1]);

  return {
    width: Number.isFinite(width) && width > 0 ? width : 800,
    height: Number.isFinite(height) && height > 0 ? height : 800,
  };
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
      const { width, height } = svgCanvasSize(originalSvg);
      const base = Math.min(width, height);
      const panelWidth = base * panelWidthRatio;
      const panelHeight = base * panelHeightRatio;
      const logoWidth = panelWidth * logoWidthRatio;
      const logoHeight = panelHeight * logoHeightRatio;
      const panelX = (width - panelWidth) / 2;
      const panelY = (height - panelHeight) / 2;
      const logoX = (width - logoWidth) / 2;
      const logoY = (height - logoHeight) / 2;
      const radius = panelHeight * 0.14;
      const logoData = `data:image/svg+xml;base64,${logo.toString("base64")}`;
      const overlay = `<rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="${radius}" fill="#ffffff"/><image href="${logoData}" x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/>`;
      const brandedSvg = originalSvg.replace(/<\/svg>\s*$/i, `${overlay}</svg>`);

      headers.set("Content-Type", "image/svg+xml; charset=utf-8");
      return new NextResponse(brandedSvg, { headers });
    }

    const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());
    const metadata = await sharp(qrBuffer).metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 1200;
    const base = Math.min(width, height);
    const panelWidth = Math.round(base * panelWidthRatio);
    const panelHeight = Math.round(base * panelHeightRatio);
    const logoWidth = Math.round(panelWidth * logoWidthRatio);
    const logoHeight = Math.round(panelHeight * logoHeightRatio);
    const left = Math.round((width - panelWidth) / 2);
    const top = Math.round((height - panelHeight) / 2);
    const logoLeft = Math.round((width - logoWidth) / 2);
    const logoTop = Math.round((height - logoHeight) / 2);

    const panel = Buffer.from(
      `<svg width="${panelWidth}" height="${panelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${panelWidth}" height="${panelHeight}" rx="${Math.round(panelHeight * 0.14)}" fill="#ffffff"/></svg>`,
    );
    const resizedLogo = await sharp(logo)
      .resize(logoWidth, logoHeight, { fit: "contain" })
      .png()
      .toBuffer();

    const brandedQr = await sharp(qrBuffer)
      .composite([
        { input: panel, left, top },
        { input: resizedLogo, left: logoLeft, top: logoTop },
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
