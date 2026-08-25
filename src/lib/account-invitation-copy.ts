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

  if (audience === "CLIENT") {
    return language === "en"
      ? {
          subject: "Welcome to CyberWeel",
          html: `<div dir="ltr" style="font-family:Arial,sans-serif"><h2>Welcome to CyberWeel</h2><p>Your CyberWeel account has been created so you can follow your project easily.</p><p>Click the button below to create your password and complete account activation.</p><p><a href="${invitationUrl}">Create a password</a></p><p>After that, sign in using your email address and the password you created to access your client dashboard, where you can follow your project, files and deliveries, invoices, payments, and messages.</p><p>This link is valid for 24 hours and can be used once.</p></div>`,
        }
      : {
          subject: "مرحبًا بك في CyberWeel",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>مرحبًا بك في CyberWeel</h2><p>تم إنشاء حسابك لدينا لمتابعة مشروعك بسهولة.</p><p>اضغط على الزر أدناه لإنشاء كلمة مرور وإكمال تفعيل حسابك.</p><p><a href="${invitationUrl}">أنشئ كلمة مرور</a></p><p>بعد ذلك يمكنك تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور التي أنشأتها، والدخول إلى لوحة العميل لمتابعة مشروعك، الملفات والتسليمات، الفواتير، المدفوعات والرسائل.</p><p>الرابط صالح لمدة 24 ساعة ويُستخدم مرة واحدة.</p></div>`,
        };
  }

  return language === "en"
    ? {
        subject: "Your CyberWeel execution partner application was accepted",
        html: `<div dir="ltr" style="font-family:Arial,sans-serif"><h2>Welcome to CyberWeel</h2><p>Your application to join CyberWeel as an execution partner has been accepted.</p><p>Use the secure link below to set your password and activate access to your partner dashboard.</p><p><a href="${invitationUrl}">Set your password and activate your account</a></p><p>This link is valid for 24 hours and can be used once. After setting your password, you will be able to sign in and complete your profile.</p></div>`,
      }
    : {
        subject: "تم قبول طلبك كشريك تنفيذ في CyberWeel",
        html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>مرحبًا بك في CyberWeel</h2><p>تم قبول طلب انضمامك كشريك تنفيذ في CyberWeel.</p><p>استخدم الرابط الآمن أدناه لتعيين كلمة المرور وتفعيل الوصول إلى لوحة الشريك.</p><p><a href="${invitationUrl}">تعيين كلمة المرور وتفعيل الحساب</a></p><p>الرابط صالح لمدة 24 ساعة ويُستخدم مرة واحدة. بعد تعيين كلمة المرور يمكنك تسجيل الدخول وإكمال ملفك.</p></div>`,
      };
}
