import { NextRequest, NextResponse } from "next/server";
import { normalizeReferralCode } from "@/lib/partner-referral";
import { REFERRAL_CODE_COOKIE } from "@/lib/referral-tracking";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isNonIndexablePage(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ambassador") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname === "/login" ||
    pathname.startsWith("/complete-profile") ||
    pathname.startsWith("/partner/")
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (request.method === "GET" && pathname === "/") {
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

  // Authentication and dashboard URLs should never compete with the public
  // website in search results. Keep robots.txt crawlable so crawlers can see
  // this response header instead of blocking the routes outright.
  if (isNonIndexablePage(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
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
  matcher: [
    "/",
    "/api/:path*",
    "/admin/:path*",
    "/ambassador/:path*",
    "/client/:path*",
    "/dashboard/:path*",
    "/account/:path*",
    "/login",
    "/complete-profile/:path*",
    "/partner/:path*",
  ],
};
