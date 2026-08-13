export const LEGACY_PARTNER_REFERRAL_COOKIE = "cyberweel_partner_referral";
export const REFERRAL_CODE_COOKIE = "cyberweel_referral_code";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function referralCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    priority: "medium" as const,
  };
}
