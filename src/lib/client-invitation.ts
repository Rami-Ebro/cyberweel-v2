import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { fingerprint } from "@/lib/partner-auth";
import {
  accountInvitationCopy,
  type AccountInvitationAudience,
  type AccountInvitationLanguage,
} from "@/lib/account-invitation-copy";

type ClientInvitationResult = { sent: boolean; error?: string; invitationUrl?: string };

async function sendAccountInvitation(
  userId: string,
  email: string,
  origin: string,
  audience: AccountInvitationAudience,
  language: AccountInvitationLanguage,
): Promise<ClientInvitationResult> {
  const token = randomBytes(32).toString("hex");
  await db.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: {
        userId,
        tokenHash: fingerprint(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  });

  const invitationUrl = `${origin}/partner/reset-password?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.CONTACT_FROM_EMAIL || "CyberWeel <noreply@cyberweel.com>";
  if (!apiKey) return { sent: false, error: "EMAIL_NOT_CONFIGURED", invitationUrl: process.env.VERCEL_ENV === "preview" ? invitationUrl : undefined };

  const emailCopy = accountInvitationCopy(audience, language, invitationUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: emailCopy.subject,
      html: emailCopy.html,
    }),
  });

  if (!response.ok) {
    console.error("[account-invitation] Resend failed", response.status, await response.text());
    return { sent: false, error: "EMAIL_SEND_FAILED", invitationUrl: process.env.VERCEL_ENV === "preview" ? invitationUrl : undefined };
  }
  return { sent: true, invitationUrl: process.env.VERCEL_ENV === "preview" ? invitationUrl : undefined };
}

export async function sendClientInvitation(
  userId: string,
  email: string,
  origin: string,
  language: AccountInvitationLanguage = "ar",
): Promise<ClientInvitationResult> {
  return sendAccountInvitation(userId, email, origin, "CLIENT", language);
}

export async function sendAmbassadorInvitation(
  userId: string,
  email: string,
  origin: string,
  language: AccountInvitationLanguage = "ar",
): Promise<ClientInvitationResult> {
  return sendAccountInvitation(userId, email, origin, "AMBASSADOR", language);
}
