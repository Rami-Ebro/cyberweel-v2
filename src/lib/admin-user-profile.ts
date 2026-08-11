import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import { findNameConflict, normalizeDisplayName } from "@/lib/user-identity";

export class AdminUserProfileError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function validatedAdminUserProfile(input: {
  userId: string;
  name: unknown;
  email: unknown;
  phone: unknown;
}) {
  const name = typeof input.name === "string" ? normalizeDisplayName(input.name) : "";
  const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
  const phone = typeof input.phone === "string" ? normalizePhone(input.phone) : "";

  if (name.length < 2) throw new AdminUserProfileError("الاسم مطلوب (حرفان على الأقل)");
  if (!email.includes("@") || email.length > 254) throw new AdminUserProfileError("البريد الإلكتروني غير صالح");
  if (phone && phone.length < 8) throw new AdminUserProfileError("رقم الهاتف غير صالح");

  const [nameConflict, emailOwner, phoneOwner] = await Promise.all([
    findNameConflict(name, input.userId),
    db.user.findFirst({ where: { email, id: { not: input.userId } }, select: { id: true } }),
    phone ? db.user.findFirst({ where: { phone, id: { not: input.userId } }, select: { id: true } }) : null,
  ]);

  if (nameConflict) throw new AdminUserProfileError("هذا الاسم مستخدم بالفعل، يرجى اختيار اسم آخر.", 409);
  if (emailOwner) throw new AdminUserProfileError("البريد الإلكتروني مستخدم في حساب آخر.", 409);
  if (phoneOwner) throw new AdminUserProfileError("رقم الهاتف مستخدم في حساب آخر.", 409);

  return { name, email, phone: phone || null };
}
