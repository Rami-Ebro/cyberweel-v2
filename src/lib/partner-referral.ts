const REFERRAL_PREFIX = "CW-";
const AMBASSADOR_REFERRAL_PREFIX = "CWA-";
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

export function formatAmbassadorReferralCode(referralNumber: number): string {
  if (!Number.isInteger(referralNumber) || referralNumber < 1) {
    throw new Error("Ambassador referral number must be a positive integer");
  }

  return `${AMBASSADOR_REFERRAL_PREFIX}${String(referralNumber).padStart(REFERRAL_DIGITS, "0")}`;
}

export function parseAmbassadorReferralCode(code: string): number | null {
  const normalizedCode = code.trim().toUpperCase();
  const match = /^CWA-(\d{4,})$/.exec(normalizedCode);

  if (!match) return null;

  const referralNumber = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(referralNumber) && referralNumber > 0
    ? referralNumber
    : null;
}

export function normalizeReferralCode(code: string): string | null {
  const ambassadorNumber = parseAmbassadorReferralCode(code);
  if (ambassadorNumber) return formatAmbassadorReferralCode(ambassadorNumber);

  const partnerNumber = parsePartnerReferralCode(code);
  if (partnerNumber) return formatPartnerReferralCode(partnerNumber);

  return null;
}
