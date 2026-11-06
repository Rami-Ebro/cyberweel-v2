type EmailMessage = { to: string; subject: string; html: string };
type MailConfig = { apiKey?: string; from?: string };

/** Provider acceptance is not proof of inbox delivery. Never log tokens or message bodies. */
export async function deliverInvitation(
  message: EmailMessage,
  config: MailConfig,
  transport: typeof fetch = fetch,
): Promise<{ sent: boolean; error?: string }> {
  if (!config.apiKey) return { sent: false, error: "EMAIL_NOT_CONFIGURED" };
  try {
    const response = await transport("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.from || "CyberWeel <noreply@cyberweel.com>", ...message }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || typeof payload?.id !== "string" || !payload.id) {
      console.error("[account-invitation] Provider rejected invitation", response.status);
      return { sent: false, error: "EMAIL_SEND_FAILED" };
    }
    return { sent: true };
  } catch {
    console.error("[account-invitation] Provider request failed");
    return { sent: false, error: "EMAIL_SEND_FAILED" };
  }
}
