const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_CANDIDATE_PATTERN = /\+?\d[\d\s().-]{5,}\d/g;
const LONG_NUMBER_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;

function redactPhoneCandidate(value: string) {
  return value.replace(PHONE_CANDIDATE_PATTERN, (candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length >= 7 ? "[CONTACT_REDACTED]" : candidate;
  });
}

export function redactPersonalData(value: string) {
  return redactPhoneCandidate(
    value
      .replace(EMAIL_PATTERN, "[EMAIL_REDACTED]")
      .replace(LONG_NUMBER_PATTERN, "[SENSITIVE_NUMBER_REDACTED]"),
  );
}

export function cleanPlainText(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function containsArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

export function normalizeArabicSummary(value: string) {
  return value.replace(/فريق(?:ه|ها|هم)(?=[\s،,.!?؛:]|$)/gu, "فريق سايبرويل");
}
