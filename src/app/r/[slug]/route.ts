import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const smartLink = await db.smartLink.findUnique({
    where: { slug },
  });

  if (!smartLink || !smartLink.isActive) {
    const response = NextResponse.redirect(new URL("/", request.url), 302);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  try {
    await db.smartLinkScan.create({
      data: {
        smartLinkId: smartLink.id,
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
      },
    });
  } catch (error) {
    console.error("Failed to record smart link scan:", error);
  }

  const response = NextResponse.redirect(smartLink.destinationUrl, 302);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
