import { head } from "@vercel/blob";

export const PAYMENT_PROOF_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

export type PaymentProofBlobVerification =
  | { ok: true; contentType: string; size: number; pathname: string }
  | { ok: false; reason: "NOT_CONFIGURED" | "INVALID" };

export async function verifyPrivatePaymentProofBlob(input: {
  url: string;
  expectedPrefix: string;
  expectedContentType?: string | null;
}): Promise<PaymentProofBlobVerification> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return { ok: false, reason: "NOT_CONFIGURED" };

  try {
    const details = await head(input.url, { token });
    const contentType = details.contentType || "";
    if (
      details.url !== input.url
      || !details.pathname.startsWith(input.expectedPrefix)
      || details.size <= 0
      || !PAYMENT_PROOF_CONTENT_TYPES.has(contentType)
      || (input.expectedContentType && contentType !== input.expectedContentType)
    ) {
      return { ok: false, reason: "INVALID" };
    }
    return { ok: true, contentType, size: details.size, pathname: details.pathname };
  } catch {
    return { ok: false, reason: "INVALID" };
  }
}
