import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import { assertNameAvailable, normalizeDisplayName, NAME_TAKEN_MESSAGE } from "@/lib/user-identity";
import type { ApplicationType, Prisma } from "@prisma/client";
import { writeAdminAudit } from "@/lib/admin-audit";

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
    phone: string | null;
    specialty: string | null;
    countryRegion: string | null;
    partnerType: string | null;
    workAreas: string[];
    supportServices: string[];
    experienceLevel: string | null;
    experienceYears: number | null;
    availabilityType: string | null;
    weeklyHours: number | null;
    cooperationTypes: string[];
    shortBio: string | null;
    paymentMethods: string[];
    otherPaymentMethod: string | null;
  },
  notes: string,
) {
  const existing = await tx.partner.findUnique({ where: { userId } });
  if (existing) {
    return tx.partner.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        applicationId: existing.applicationId || application.id,
        specialty: existing.specialty || application.specialty,
        phone: existing.phone || application.phone,
        countryRegion: existing.countryRegion || application.countryRegion,
        partnerType: existing.partnerType || application.partnerType,
        workAreas: existing.workAreas.length ? existing.workAreas : application.workAreas,
        supportServices: existing.supportServices.length ? existing.supportServices : application.supportServices,
        experienceLevel: existing.experienceLevel || application.experienceLevel,
        experienceYears: existing.experienceYears ?? application.experienceYears,
        availabilityType: existing.availabilityType || application.availabilityType,
        weeklyHours: existing.weeklyHours ?? application.weeklyHours,
        cooperationTypes: existing.cooperationTypes.length ? existing.cooperationTypes : application.cooperationTypes,
        shortBio: existing.shortBio || application.shortBio,
        paymentMethods: existing.paymentMethods.length ? existing.paymentMethods : application.paymentMethods,
        otherPaymentMethod: existing.otherPaymentMethod || application.otherPaymentMethod,
        profileCompletedAt: existing.profileCompletedAt || (application.partnerType ? new Date() : null),
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
        phone: linked.phone || application.phone,
        countryRegion: linked.countryRegion || application.countryRegion,
        partnerType: linked.partnerType || application.partnerType,
        workAreas: linked.workAreas.length ? linked.workAreas : application.workAreas,
        supportServices: linked.supportServices.length ? linked.supportServices : application.supportServices,
        experienceLevel: linked.experienceLevel || application.experienceLevel,
        experienceYears: linked.experienceYears ?? application.experienceYears,
        availabilityType: linked.availabilityType || application.availabilityType,
        weeklyHours: linked.weeklyHours ?? application.weeklyHours,
        cooperationTypes: linked.cooperationTypes.length ? linked.cooperationTypes : application.cooperationTypes,
        shortBio: linked.shortBio || application.shortBio,
        paymentMethods: linked.paymentMethods.length ? linked.paymentMethods : application.paymentMethods,
        otherPaymentMethod: linked.otherPaymentMethod || application.otherPaymentMethod,
        profileCompletedAt: linked.profileCompletedAt || (application.partnerType ? new Date() : null),
        decisionNotes: notes || linked.decisionNotes,
        decidedAt: new Date(),
      },
    });
  }

  return tx.partner.create({
    data: {
      userId,
      applicationId: application.id,
      status: "ACTIVE",
      specialty: application.specialty,
      phone: application.phone,
      countryRegion: application.countryRegion,
      partnerType: application.partnerType,
      workAreas: application.workAreas,
      supportServices: application.supportServices,
      experienceLevel: application.experienceLevel,
      experienceYears: application.experienceYears,
      availabilityType: application.availabilityType,
      weeklyHours: application.weeklyHours,
      cooperationTypes: application.cooperationTypes,
      shortBio: application.shortBio,
      paymentMethods: application.paymentMethods,
      otherPaymentMethod: application.otherPaymentMethod,
      payoutMethods: application.paymentMethods.join("، ") || null,
      profileCompletedAt: application.partnerType ? new Date() : null,
      decisionNotes: notes || null,
      decidedAt: new Date(),
    },
  });
}

async function ensureAmbassadorForUser(
  tx: Tx,
  userId: string,
  notes: string,
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
      await assertNameAvailable(name, existing.id, tx).catch(() => {
        throw new AcceptApplicationError("NAME_TAKEN", 409);
      });
    }

    return tx.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name || name,
        phone: existing.phone || phone,
        isActive: true,
      },
    });
  }

  await assertNameAvailable(name, undefined, tx).catch(() => {
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
        if (input.type === "PARTNER") await writeAdminAudit(tx, { actorId: input.decidedById, action: "PARTNER_APPLICATION_REJECTED", category: "SENSITIVE", entityType: "PARTNER_APPLICATION", entityId: application.id, entityLabel: application.name, before: { status: application.status, reviewState: application.reviewState }, after: { status: "REJECTED", reviewState: "REJECTED", notes } });

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

    let partnerId: string | null = null;
    if (input.type === "PARTNER") {
      const partner = await ensurePartnerForUser(tx, user.id, application, notes);
      partnerId = partner.id;
    } else {
      await ensureAmbassadorForUser(tx, user.id, notes);
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
    if (input.type === "PARTNER") {
      await writeAdminAudit(tx, { actorId: input.decidedById, action: "PARTNER_APPLICATION_ACCEPTED", category: "POSITIVE", entityType: "PARTNER_APPLICATION", entityId: application.id, entityLabel: application.name, before: { status: application.status, reviewState: application.reviewState }, after: { status: "ACCEPTED", reviewState: "ACCEPTED" } });
      await writeAdminAudit(tx, { actorId: input.decidedById, action: "PARTNER_ACCOUNT_ACTIVATED", category: "POSITIVE", entityType: "PARTNER", entityId: partnerId, entityLabel: application.name, before: { active: false }, after: { active: true, status: "ACTIVE" } });
    }

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
