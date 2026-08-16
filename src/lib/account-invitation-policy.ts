type AcceptanceResult = {
  idempotent: boolean;
  userId?: string | null;
  email?: string;
};

export function shouldSendAcceptanceInvitation(
  result: AcceptanceResult,
): result is AcceptanceResult & { userId: string; email: string } {
  return !result.idempotent && Boolean(result.userId && result.email);
}
