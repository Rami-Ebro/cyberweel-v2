import { NextRequest, NextResponse } from "next/server";
import { normalizeReferralCode } from "@/lib/partner-referral";
import { REFERRAL_CODE_COOKIE, referralCookieOptions } from "@/lib/referral-tracking";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  if (request.method === "GET" && request.nextUrl.pathname === "/") {
    const referralCode = normalizeReferralCode(request.nextUrl.searchParams.get("ref") || "");
    const response = NextResponse.next();
    if (referralCode) {
      response.cookies.set(REFERRAL_CODE_COOKIE, referralCode, referralCookieOptions());
    }
    return response;
  }

  if (!STATE_CHANGING_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.next();

  try {
    if (new URL(origin).origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/:path*"],
};
