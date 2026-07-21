import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const logoPanelRatio = 0.24;
const logoRatioWithinPanel = 0.66;

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
      const panelSize = Math.min(width, height) * logoPanelRatio;
      const logoSize = panelSize * logoRatioWithinPanel;
      const panelX = (width - panelSize) / 2;
      const panelY = (height - panelSize) / 2;
      const logoX = (width - logoSize) / 2;
      const logoY = (height - logoSize) / 2;
      const radius = panelSize * 0.14;
      const logoData = `data:image/svg+xml;base64,${logo.toString("base64")}`;
      const overlay = `<rect x="${panelX}" y="${panelY}" width="${panelSize}" height="${panelSize}" rx="${radius}" fill="#ffffff"/><image href="${logoData}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;
      const brandedSvg = originalSvg.replace(/<\/svg>\s*$/i, `${overlay}</svg>`);

      headers.set("Content-Type", "image/svg+xml; charset=utf-8");
      return new NextResponse(brandedSvg, { headers });
    }

    const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());
    const metadata = await sharp(qrBuffer).metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 1200;
    const panelSize = Math.round(Math.min(width, height) * logoPanelRatio);
    const logoSize = Math.round(panelSize * logoRatioWithinPanel);
    const left = Math.round((width - panelSize) / 2);
    const top = Math.round((height - panelSize) / 2);
    const logoLeft = Math.round((width - logoSize) / 2);
    const logoTop = Math.round((height - logoSize) / 2);

    const panel = Buffer.from(
      `<svg width="${panelSize}" height="${panelSize}" xmlns="http://www.w3.org/2000/svg"><rect width="${panelSize}" height="${panelSize}" rx="${Math.round(panelSize * 0.14)}" fill="#ffffff"/></svg>`,
    );
    const resizedLogo = await sharp(logo)
      .resize(logoSize, logoSize, { fit: "contain" })
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
