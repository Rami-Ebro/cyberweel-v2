import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const referer = request.headers.get("referer") || "";
  const target = new URL("/wa", request.url);

  if (referer.includes("/partner/dashboard")) {
    target.searchParams.set("context", "partner-support");
  }

  return NextResponse.redirect(target, 302);
}
