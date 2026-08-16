export type AccountInvitationAudience = "CLIENT" | "PARTNER" | "AMBASSADOR";
export type AccountInvitationLanguage = "ar" | "en";

export function accountInvitationCopy(
  audience: AccountInvitationAudience,
  language: AccountInvitationLanguage,
  invitationUrl: string,
) {
  if (audience === "AMBASSADOR") {
    return language === "en"
      ? {
          subject: "Your CyberWeel ambassador application was accepted",
          html: `<div dir="ltr" style="font-family:Arial,sans-serif"><h2>Welcome to CyberWeel</h2><p>Your application to join CyberWeel as an ambassador has been accepted.</p><p>Use the secure link below to set your password and activate access to your account.</p><p><a href="${invitationUrl}">Set your password and activate your account</a></p><p>This link is valid for 24 hours and can be used once. After setting your password, sign in and complete your profile.</p></div>`,
        }
      : {
          subject: "تم قبول طلبك كسفير في CyberWeel",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>مرحبًا بك في CyberWeel</h2><p>تم قبول طلب انضمامك كسفير في CyberWeel.</p><p>استخدم الرابط الآمن أدناه لتعيين كلمة المرور وتفعيل الوصول إلى حسابك.</p><p><a href="${invitationUrl}">تعيين كلمة المرور وتفعيل الحساب</a></p><p>الرابط صالح لمدة 24 ساعة ويُستخدم مرة واحدة. بعد تعيين كلمة المرور، سجّل الدخول وأكمل ملفك.</p></div>`,
        };
  }

  return language === "en"
    ? {
        subject: "Your CyberWeel Account Invitation",
        html: `<div dir="ltr" style="font-family:Arial,sans-serif"><h2>Welcome to CyberWeel</h2><p>The admin team has created your profile. Use the link below to set your password and access your dashboard.</p><p><a href="${invitationUrl}">Set your password</a></p><p>This link is valid for 24 hours and can be used once.</p></div>`,
      }
    : {
        subject: "دعوة الدخول إلى CyberWeel",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>مرحبًا بك في CyberWeel</h2><p>أنشأت الإدارة ملفك. اضغط على الرابط التالي لتعيين كلمة المرور والدخول إلى لوحة حسابك.</p><p><a href="${invitationUrl}">تعيين كلمة المرور</a></p><p>الرابط صالح لمدة 24 ساعة ويُستخدم مرة واحدة.</p></div>`,
      };
}
