import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { fingerprint } from "@/lib/partner-auth";

type ClientInvitationResult = { sent: boolean; error?: string; invitationUrl?: string };

export async function sendClientInvitation(userId: string, email: string, origin: string, language: "ar" | "en" = "ar"): Promise<ClientInvitationResult> {
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash: fingerprint(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const invitationUrl = `${origin}/partner/reset-password?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.CONTACT_FROM_EMAIL || "CyberWeel <noreply@cyberweel.com>";
  if (!apiKey) return { sent: false, error: "EMAIL_NOT_CONFIGURED", invitationUrl: process.env.VERCEL_ENV === "preview" ? invitationUrl : undefined };

  const emailCopy = language === "en"
    ? {
        subject: "Your CyberWeel Account Invitation",
        html: `<div dir="ltr" style="font-family:Arial,sans-serif"><h2>Welcome to CyberWeel</h2><p>The admin team has created your profile. Use the link below to set your password and access your dashboard.</p><p><a href="${invitationUrl}">Set your password</a></p><p>This link is valid for 24 hours and can be used once.</p></div>`,
      }
    : {
        subject: "دعوة الدخول إلى CyberWeel",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>مرحبًا بك في CyberWeel</h2><p>أنشأت الإدارة ملفك. اضغط على الرابط التالي لتعيين كلمة المرور والدخول إلى لوحة حسابك.</p><p><a href="${invitationUrl}">تعيين كلمة المرور</a></p><p>الرابط صالح لمدة 24 ساعة ويُستخدم مرة واحدة.</p></div>`,
      };

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
    console.error("[client-invitation] Resend failed", response.status, await response.text());
    return { sent: false, error: "EMAIL_SEND_FAILED" };
  }
  return { sent: true };
}
