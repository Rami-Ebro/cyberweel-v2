import { NextRequest, NextResponse } from "next/server";
import { normalizeReferralCode } from "@/lib/partner-referral";
import { REFERRAL_CODE_COOKIE } from "@/lib/referral-tracking";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  if (request.method === "GET" && request.nextUrl.pathname === "/") {
    const referralCode = normalizeReferralCode(request.nextUrl.searchParams.get("ref") || "");
    if (!referralCode) return NextResponse.next();

    // A matching HttpOnly cookie means /ref/[code] has already verified that
    // this code belongs to an active ambassador or partner. New or changed
    // codes must pass through that database-backed validation before storage.
    if (request.cookies.get(REFERRAL_CODE_COOKIE)?.value === referralCode) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(`/ref/${encodeURIComponent(referralCode)}`, request.url),
      302,
    );
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
