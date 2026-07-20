"use client";

import { Download, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const qrBrandVersion = "arch-final-20260720";

export function QrCodeActions({ slug }: { slug: string }) {
  const encodedSlug = encodeURIComponent(slug);
  const pngUrl = `/api/admin/qr?slug=${encodedSlug}&format=png&v=${qrBrandVersion}`;
  const svgUrl = `/api/admin/qr?slug=${encodedSlug}&format=svg&v=${qrBrandVersion}`;
  const targetUrl = `https://www.cyberweel.com/r/${slug}`;

  return (
    <details className="group min-w-40">
      <summary className="list-none">
        <Button type="button" size="sm" variant="outline" asChild>
          <span className="cursor-pointer">
            <QrCode />
            QR
          </span>
        </Button>
      </summary>

      <div className="mt-3 w-64 rounded-xl border border-border bg-white p-4 text-right shadow-lg">
        <img
          src={pngUrl}
          alt={`رمز QR للرابط ${slug}`}
          width={224}
          height={224}
          className="mx-auto aspect-square w-full rounded-lg border border-border bg-white object-contain"
          loading="eager"
        />

        <p className="mt-3 truncate text-xs font-semibold text-muted-foreground" dir="ltr" title={targetUrl}>
          {targetUrl}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild size="sm">
            <a href={pngUrl} download={`cyberweel-${slug}-qr.png`}>
              <Download />
              PNG
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={svgUrl} download={`cyberweel-${slug}-qr.svg`}>
              <Download />
              SVG
            </a>
          </Button>
        </div>

        <Button asChild size="sm" variant="ghost" className="mt-2 w-full">
          <a href={targetUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            اختبار الرابط
          </a>
        </Button>
      </div>
    </details>
  );
}
