const REFERRAL_PREFIX = "CW-";
const REFERRAL_DIGITS = 4;

export function formatPartnerReferralCode(referralNumber: number): string {
  if (!Number.isInteger(referralNumber) || referralNumber < 1) {
    throw new Error("Partner referral number must be a positive integer");
  }

  return `${REFERRAL_PREFIX}${String(referralNumber).padStart(REFERRAL_DIGITS, "0")}`;
}

export function parsePartnerReferralCode(code: string): number | null {
  const normalizedCode = code.trim().toUpperCase();
  const match = /^CW-(\d{4,})$/.exec(normalizedCode);

  if (!match) {
    return null;
  }

  const referralNumber = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(referralNumber) && referralNumber > 0
    ? referralNumber
    : null;
}
