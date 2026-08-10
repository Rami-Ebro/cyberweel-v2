import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import { assertNameAvailable, normalizeDisplayName, NAME_TAKEN_MESSAGE } from "@/lib/user-identity";
import type { ApplicationType, Prisma } from "@prisma/client";

export class AcceptApplicationError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

type AcceptInput = {
  applicationId: string;
  type: ApplicationType;
  status: "ACCEPTED" | "REJECTED";
  notes: string;
  password?: string;
  decidedById: string | null;
};

type Tx = Prisma.TransactionClient;

async function loadApplication(tx: Tx, id: string, type: ApplicationType) {
  const application = await tx.collaborationApplication.findUnique({ where: { id } });
  if (!application || application.type !== type) {
    throw new AcceptApplicationError("NOT_FOUND", 404);
  }
  return application;
}

async function ensurePartnerForUser(
  tx: Tx,
  userId: string,
  application: {
    id: string;
    name: string;
    specialty: string | null;
  },
  notes: string,
  password?: string,
) {
  const existing = await tx.partner.findUnique({ where: { userId } });
  if (existing) {
    return tx.partner.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        applicationId: existing.applicationId || application.id,
        specialty: existing.specialty || application.specialty,
        decisionNotes: notes || existing.decisionNotes,
        decidedAt: new Date(),
      },
    });
  }

  const linked = await tx.partner.findUnique({ where: { applicationId: application.id } });
  if (linked) {
    return tx.partner.update({
      where: { id: linked.id },
      data: {
        userId,
        status: "ACTIVE",
        specialty: linked.specialty || application.specialty,
        decisionNotes: notes || linked.decisionNotes,
        decidedAt: new Date(),
      },
    });
  }

  if (password && password.length >= 10) {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(password) },
    });
  }

  return tx.partner.create({
    data: {
      userId,
      applicationId: application.id,
      status: "ACTIVE",
      specialty: application.specialty,
      decisionNotes: notes || null,
      decidedAt: new Date(),
    },
  });
}

async function ensureAmbassadorForUser(
  tx: Tx,
  userId: string,
  notes: string,
  password?: string,
) {
  const existing = await tx.ambassador.findUnique({ where: { userId } });
  if (existing) {
    return tx.ambassador.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        decisionNotes: notes || existing.decisionNotes,
        decidedAt: new Date(),
      },
    });
  }

  if (password && password.length >= 10) {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(password) },
    });
  }

  return tx.ambassador.create({
    data: {
      userId,
      status: "ACTIVE",
      decisionNotes: notes || null,
      decidedAt: new Date(),
    },
  });
}

async function resolveOrCreateUser(
  tx: Tx,
  application: {
    name: string;
    email: string;
    phone: string | null;
  },
  role: "PARTNER" | "AMBASSADOR",
  password: string,
) {
  const email = normalizeEmail(application.email);
  const phone = application.phone ? normalizePhone(application.phone) || application.phone.trim() : null;
  const name = normalizeDisplayName(application.name);

  const existing = await tx.user.findUnique({
    where: { email },
    include: { partner: true, ambassador: true, adminProfile: true },
  });

  if (existing?.adminProfile || existing?.role === "ADMIN") {
    throw new AcceptApplicationError("ADMIN_EMAIL", 409);
  }

  if (phone) {
    const phoneOwner = await tx.user.findFirst({
      where: { phone, ...(existing ? { id: { not: existing.id } } : {}) },
      select: { id: true },
    });
    if (phoneOwner) throw new AcceptApplicationError("PHONE_EXISTS", 409);
  }

  if (existing) {
    const sameCapability =
      (role === "PARTNER" && existing.partner) || (role === "AMBASSADOR" && existing.ambassador);

    if (!sameCapability) {
      await assertNameAvailable(name, existing.id).catch(() => {
        throw new AcceptApplicationError("NAME_TAKEN", 409);
      });
    }

    return tx.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name || name,
        phone: existing.phone || phone,
        passwordHash: password.length >= 10 ? hashPassword(password) : existing.passwordHash,
        isActive: true,
      },
    });
  }

  await assertNameAvailable(name).catch(() => {
    throw new AcceptApplicationError("NAME_TAKEN", 409);
  });

  return tx.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      role,
      isActive: true,
    },
  });
}

async function markApplication(
  tx: Tx,
  applicationId: string,
  status: "ACCEPTED" | "REJECTED",
  notes: string,
  decidedById: string | null,
) {
  const data = {
    status,
    reviewState: status,
    decisionNotes: notes || null,
    decidedAt: new Date(),
    decidedById,
  };

  const claimed = await tx.collaborationApplication.updateMany({
    where: { id: applicationId, status: "PENDING" },
    data,
  });

  if (claimed.count === 1) return "claimed" as const;

  const current = await tx.collaborationApplication.findUnique({ where: { id: applicationId } });
  if (!current) throw new AcceptApplicationError("NOT_FOUND", 404);
  if (current.status === status) return "already" as const;
  throw new AcceptApplicationError("ALREADY_DECIDED", 409);
}

type CollaborationDecisionResult = {
  ok: true;
  idempotent: boolean;
  userId?: string | null;
  email?: string;
};

export async function decideCollaborationApplication(
  input: AcceptInput
): Promise<CollaborationDecisionResult> {
  const notes = input.notes.trim();

  if (input.status === "REJECTED" && !notes) {
    throw new AcceptApplicationError("NOTES_REQUIRED", 400);
  }

  if (input.status === "REJECTED") {
    const result: CollaborationDecisionResult = await db.$transaction(
      async (tx) => {
        const application = await loadApplication(
          tx,
          input.applicationId,
          input.type
        );

        if (application.status === "REJECTED") {
          return {
            ok: true,
            idempotent: true,
          };
        }

        if (application.status !== "PENDING") {
          throw new AcceptApplicationError("ALREADY_DECIDED", 409);
        }

        await markApplication(
          tx,
          application.id,
          "REJECTED",
          notes,
          input.decidedById
        );

        await tx.adminNotification.create({
          data: {
            title:
              input.type === "PARTNER"
                ? "تم رفض طلب شريك التنفيذ"
                : "تم رفض طلب سفير",
            body: `${application.name} — ${notes}`,
            href:
              input.type === "PARTNER"
                ? "/admin/partners?section=partners"
                : "/admin/ambassadors",
            kind:
              input.type === "PARTNER"
                ? "PARTNER_REJECTED"
                : "AMBASSADOR_REJECTED",
          },
        });

        return {
          ok: true,
          idempotent: false,
        };
      }
    );

    return result;
  }

  const password =
    typeof input.password === "string" ? input.password : "";

  if (password.length < 10) {
    throw new AcceptApplicationError("TEMP_PASSWORD_REQUIRED", 400);
  }

  return db.$transaction(async (tx): Promise<CollaborationDecisionResult> => {
    const application = await loadApplication(
      tx,
      input.applicationId,
      input.type
    );

    if (application.status === "ACCEPTED") {
      const email = normalizeEmail(application.email);

      const user = await tx.user.findUnique({
        where: { email },
        include: {
          partner: true,
          ambassador: true,
        },
      });

      if (input.type === "PARTNER") {
        if (user) {
          await ensurePartnerForUser(
            tx,
            user.id,
            application,
            notes || application.decisionNotes || "",
            password
          );
        }

        return {
          ok: true,
          idempotent: true,
          userId: user?.id ?? null,
          email,
        };
      }

      if (user) {
        await ensureAmbassadorForUser(
          tx,
          user.id,
          notes || application.decisionNotes || "",
          password
        );
      }

      return {
        ok: true,
        idempotent: true,
        userId: user?.id ?? null,
        email,
      };
    }

    if (application.status !== "PENDING") {
      throw new AcceptApplicationError("ALREADY_DECIDED", 409);
    }
    const role = input.type === "PARTNER" ? "PARTNER" : "AMBASSADOR";
    const user = await resolveOrCreateUser(tx, application, role, password);

    if (input.type === "PARTNER") {
      await ensurePartnerForUser(tx, user.id, application, notes, password);
    } else {
      await ensureAmbassadorForUser(tx, user.id, notes, password);
    }

    await markApplication(tx, application.id, "ACCEPTED", notes, input.decidedById);

    await tx.adminNotification.create({
      data: {
        title: input.type === "PARTNER" ? "تم إنشاء حساب شريك التنفيذ" : "تم إنشاء حساب سفير",
        body: `${application.name} — ${application.email}`,
        href: input.type === "PARTNER" ? "/admin/partners?section=partners" : "/admin/ambassadors",
        kind: input.type === "PARTNER" ? "PARTNER_ACCEPTED" : "AMBASSADOR_ACCEPTED",
      },
    });

    return {
      ok: true as const,
      idempotent: false,
      userId: user.id,
      email: user.email,
    };
  });
}

export function acceptErrorMessage(code: string) {
  const messages: Record<string, string> = {
    NOT_FOUND: "الطلب غير موجود",
    ALREADY_DECIDED: "سبق اتخاذ قرار بشأن هذا الطلب. حدّث الصفحة.",
    TEMP_PASSWORD_REQUIRED: "كلمة مرور مؤقتة من 10 أحرف مطلوبة",
    NOTES_REQUIRED: "سبب الرفض مطلوب",
    NAME_TAKEN: NAME_TAKEN_MESSAGE,
    PHONE_EXISTS: "يوجد حساب مسجل برقم الهاتف، لذلك لم يُنشأ حساب مكرر.",
    ADMIN_EMAIL: "لا يمكن ربط هذا البريد بحساب شريك أو سفير لأنه حساب إدارة.",
    EMAIL_EXISTS: "يوجد حساب مسجل بهذا البريد الإلكتروني، لذلك لم يُنشأ حساب مكرر.",
  };
  return messages[code] || code;
}
