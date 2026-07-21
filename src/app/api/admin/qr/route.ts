import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const panelRatio = 0.27;
const markRatio = 0.82;

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

function markSvg(x: number, y: number, width: number, height: number) {
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="75 42 648 555" preserveAspectRatio="xMidYMid meet">
    <g fill="#1B2533">
      <path d="M 442.979 113.075 A 316 316 0 0 1 539.999 143.201 L 496.271 230.904 A 218 218 0 0 0 429.340 210.122 Z"/>
      <path d="M 554.606 150.968 A 316 316 0 0 1 633.834 214.555 L 561.006 280.130 A 218 218 0 0 0 506.348 236.262 Z"/>
      <path d="M 644.578 227.135 A 316 316 0 0 1 694.988 315.334 L 603.195 349.655 A 218 218 0 0 0 568.418 288.808 Z"/>
      <path d="M 700.375 330.977 A 316 316 0 0 1 714.952 431.515 L 616.967 429.805 A 218 218 0 0 0 606.910 360.446 Z"/>
      <path d="M 258.001 143.201 A 316 316 0 0 1 355.021 113.075 L 368.660 210.122 A 218 218 0 0 0 301.729 230.904 Z"/>
      <path d="M 164.166 214.555 A 316 316 0 0 1 243.394 150.968 L 291.652 236.262 A 218 218 0 0 0 236.994 280.130 Z"/>
      <path d="M 103.012 315.334 A 316 316 0 0 1 153.422 227.135 L 229.582 288.808 A 218 218 0 0 0 194.805 349.655 Z"/>
      <path d="M 83.048 431.515 A 316 316 0 0 1 97.625 330.977 L 191.090 360.446 A 218 218 0 0 0 181.033 429.805 Z"/>
      <path d="M 83 444 H 181 V 590 H 83 Z"/>
      <path d="M 617 444 H 715 V 590 H 617 Z"/>
    </g>
    <path d="M 357 58 C 378 48, 418 48, 439 58 L 422 158 C 416.4138 156.2812, 409.3504 155.3009, 402 155.0593 L 402 71 C 402 67.134, 395 67.134, 395 71 L 395 155.051 C 387.4986 155.2777, 380.0876 156.2607, 374 158 L 357 58 Z" fill="#C39A45"/>
  </svg>`;
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
    const qrResponse = await fetch(qrSourceUrl(targetUrl, format), { cache: "no-store" });

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
      const panelSize = base * panelRatio;
      const markSize = panelSize * markRatio;
      const panelX = (width - panelSize) / 2;
      const panelY = (height - panelSize) / 2;
      const markX = (width - markSize) / 2;
      const markY = (height - markSize) / 2;
      const radius = panelSize * 0.12;
      const overlay = `<rect x="${panelX}" y="${panelY}" width="${panelSize}" height="${panelSize}" rx="${radius}" fill="#ffffff"/>${markSvg(markX, markY, markSize, markSize)}`;
      const brandedSvg = originalSvg.replace(/<\/svg>\s*$/i, `${overlay}</svg>`);

      headers.set("Content-Type", "image/svg+xml; charset=utf-8");
      return new NextResponse(brandedSvg, { headers });
    }

    const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());
    const metadata = await sharp(qrBuffer).metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 1200;
    const base = Math.min(width, height);
    const panelSize = Math.round(base * panelRatio);
    const markSize = Math.round(panelSize * markRatio);
    const left = Math.round((width - panelSize) / 2);
    const top = Math.round((height - panelSize) / 2);
    const markX = Math.round((panelSize - markSize) / 2);
    const markY = Math.round((panelSize - markSize) / 2);

    const overlay = Buffer.from(
      `<svg width="${panelSize}" height="${panelSize}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${panelSize}" height="${panelSize}" rx="${Math.round(panelSize * 0.12)}" fill="#ffffff"/>
        ${markSvg(markX, markY, markSize, markSize)}
      </svg>`,
    );

    const brandedQr = await sharp(qrBuffer)
      .composite([{ input: overlay, left, top }])
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
