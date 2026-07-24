import { PARTNER_SESSION_COOKIE, partnerSessionCookieOptions } from "@/lib/partner-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PARTNER_SESSION_COOKIE, "", { ...partnerSessionCookieOptions, maxAge: 0 });
  return response;
}
