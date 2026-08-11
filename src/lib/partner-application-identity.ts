export type PartnerApplicationIdentityUser = {
  id: string;
  role: string;
  partner: { id: string } | null;
  adminProfile: { isActive: boolean } | null;
};

type IdentityDecision =
  | { allowed: true; existingUser: PartnerApplicationIdentityUser | null }
  | {
      allowed: false;
      code: "IDENTITY_CONFLICT" | "PARTNER_EXISTS" | "ADMIN_ACCOUNT";
      message: string;
    };

export function assessPartnerApplicationIdentity(
  emailOwner: PartnerApplicationIdentityUser | null,
  phoneOwner: PartnerApplicationIdentityUser | null,
): IdentityDecision {
  if (emailOwner && phoneOwner && emailOwner.id !== phoneOwner.id) {
    return {
      allowed: false,
      code: "IDENTITY_CONFLICT",
      message: "البريد الإلكتروني ورقم الهاتف مرتبطان بحسابين مختلفين. استخدم بيانات حساب واحد.",
    };
  }

  const existingUser = emailOwner || phoneOwner;
  if (!existingUser) return { allowed: true, existingUser: null };

  if (existingUser.role === "ADMIN" || existingUser.adminProfile?.isActive) {
    return {
      allowed: false,
      code: "ADMIN_ACCOUNT",
      message: "لا يمكن استخدام حساب الإدارة لتقديم طلب شريك.",
    };
  }

  if (existingUser.role === "PARTNER" || existingUser.partner) {
    return {
      allowed: false,
      code: "PARTNER_EXISTS",
      message: "يوجد حساب شريك مرتبط بهذا البريد الإلكتروني أو رقم الهاتف. سجّل الدخول بدل إرسال طلب جديد.",
    };
  }

  return { allowed: true, existingUser };
}
