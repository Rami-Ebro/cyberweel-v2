import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { fingerprint } from "@/lib/partner-auth";
import { deliverInvitation } from "@/lib/invitation-delivery";
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, error: "EMAIL_NOT_CONFIGURED" };
  const token = randomBytes(32).toString("hex");
  const invitation = await db.passwordResetToken.create({
      data: {
        userId,
        tokenHash: fingerprint(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
  });

  const invitationUrl = `${origin}/partner/reset-password?token=${token}`;
  const from = process.env.EMAIL_FROM || process.env.CONTACT_FROM_EMAIL || "CyberWeel <noreply@cyberweel.com>";

  const emailCopy = accountInvitationCopy(audience, language, invitationUrl);

  const result = await deliverInvitation({ to: email, ...emailCopy }, { apiKey, from });
  if (!result.sent) {
    // A failed retry must not invalidate a previously delivered, still-valid link.
    await db.passwordResetToken.update({ where: { id: invitation.id }, data: { usedAt: new Date() } });
    return result;
  }
  return { sent: true, invitationUrl: process.env.VERCEL_ENV === "preview" ? invitationUrl : undefined };
}

export async function sendClientInvitation(
  userId: string,
  email: string,
  origin: string,
  language: AccountInvitationLanguage = "ar",
): Promise<ClientInvitationResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const audience: AccountInvitationAudience = user?.role === "PARTNER" ? "PARTNER" : "CLIENT";
  return sendAccountInvitation(userId, email, origin, audience, language);
}

export async function sendAmbassadorInvitation(
  userId: string,
  email: string,
  origin: string,
  language: AccountInvitationLanguage = "ar",
): Promise<ClientInvitationResult> {
  return sendAccountInvitation(userId, email, origin, "AMBASSADOR", language);
}
