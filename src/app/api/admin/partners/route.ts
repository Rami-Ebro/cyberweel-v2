import { db } from "@/lib/db";
import { canAdmin, currentAdminAccess } from "@/lib/admin-permissions";
import { NextRequest, NextResponse } from "next/server";
import { sendClientInvitation } from "@/lib/client-invitation";
import {
  AcceptApplicationError,
  acceptErrorMessage,
  decideCollaborationApplication,
} from "@/lib/accept-collaboration";
import { clientAccessWhere } from "@/lib/user-identity";
import type { ClientProjectStatus } from "@prisma/client";
import { AdminUserProfileError, validatedAdminUserProfile } from "@/lib/admin-user-profile";
import { writeAdminAudit } from "@/lib/admin-audit";
import { syncStageReward } from "@/lib/ambassador-rewards";

function normalizeProjectLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseProjectLinks(value: unknown) {
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : [];
  const values = raw.map((item) => item.trim()).filter(Boolean);
  const parsed = values.map((original) => ({ original, normalized: normalizeProjectLink(original) }));
  return {
    links: [...new Set(parsed.flatMap((item) => item.normalized ? [item.normalized] : []))],
    invalid: parsed.filter((item) => !item.normalized).map((item) => item.original),
  };
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function textValue(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function partnerIdsFromBody(body: unknown, legacyId = "") {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const ids = stringList(record.partnerIds);
  const legacyPartnerId = typeof record.partnerId === "string" ? record.partnerId.trim() : legacyId;
  return [...new Set(ids.length ? ids : legacyPartnerId ? [legacyPartnerId] : [])];
}

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  const partnerId = request.nextUrl.searchParams.get("partnerId")?.trim();
  const canView = await Promise.all([
    canAdmin(request, "overview"),
    canAdmin(request, "partners"),
    canAdmin(request, "referrals"),
    canAdmin(request, "projects"),
  ]);
  if (!canView.some(Boolean)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  if (partnerId) {
    if (!canView[1]) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });

    const [partner, projectOptions] = await Promise.all([
      db.partner.findUnique({
        where: { id: partnerId },
        include: {
          user: { select: { name: true, email: true, phone: true, isActive: true, createdAt: true } },
          application: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              specialty: true,
              market: true,
              details: true,
              status: true,
              reviewState: true,
              decisionNotes: true,
              decidedAt: true,
              createdAt: true,
            },
          },
          assignments: {
            orderBy: { createdAt: "desc" },
            include: {
              clientProject: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  progress: true,
                  currency: true,
                  dueAt: true,
                  client: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          _count: { select: { referrals: true } },
        },
      }),
      db.clientProject.findMany({
        orderBy: { createdAt: "desc" },
        where: { partnerAssignments: { none: { partnerId } } },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          currency: true,
          dueAt: true,
          client: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    if (!partner) return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });
    const statusHistory = await db.adminAuditLog.findMany({
      where: { OR: [{ entityType: "PARTNER", entityId: partner.id }, ...(partner.application?.id ? [{ entityType: "PARTNER_APPLICATION", entityId: partner.application.id }] : [])] },
      orderBy: { createdAt: "asc" },
      select: { id: true, action: true, createdAt: true, actor: { select: { name: true, email: true } } },
    });
    const journey = [...statusHistory];
    if (partner.application && !journey.some((event) => event.action === "PARTNER_APPLICATION_SUBMITTED")) {
      journey.push({ id: `legacy-submitted-${partner.application.id}`, action: "PARTNER_APPLICATION_SUBMITTED", createdAt: partner.application.createdAt, actor: null });
    }
    if (partner.application?.status === "ACCEPTED" && partner.application.decidedAt && !journey.some((event) => event.action === "PARTNER_APPLICATION_ACCEPTED")) {
      journey.push({ id: `legacy-accepted-${partner.application.id}`, action: "PARTNER_APPLICATION_ACCEPTED", createdAt: partner.application.decidedAt, actor: null });
    }
    if (!journey.some((event) => event.action === (partner.status === "SUSPENDED" ? "PARTNER_ACCOUNT_SUSPENDED" : "PARTNER_ACCOUNT_ACTIVATED"))) {
      journey.push({ id: `legacy-status-${partner.id}`, action: partner.status === "SUSPENDED" ? "PARTNER_ACCOUNT_SUSPENDED" : partner.status === "ACTIVE" ? "PARTNER_ACCOUNT_ACTIVATED" : "PARTNER_REVIEW_STARTED", createdAt: partner.updatedAt, actor: null });
    }
    journey.sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
    return NextResponse.json({ partner: { ...partner, statusHistory: journey }, projectOptions });
  }

  const wantOverview = !scope || scope === "all" || scope === "overview";
  const wantPartners = !scope || scope === "all" || scope === "partners";
  const wantProjects = !scope || scope === "all" || scope === "projects";
  const wantReferrals = !scope || scope === "all" || scope === "overview" || scope === "projects";

  const [partners, referrals, applications, overviewStats, clients, clientProjects] = await Promise.all([
    canView[1] && wantPartners
      ? db.partner.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true, phone: true, isActive: true } },
            assignments: { orderBy: { createdAt: "desc" }, include: { clientProject: { select: { id: true, title: true, clientId: true } } } },
            _count: { select: { referrals: true } },
          },
        })
      : wantProjects && canView[3]
        ? db.partner.findMany({
            orderBy: { createdAt: "desc" },
            where: { status: "ACTIVE" },
            include: {
              user: { select: { name: true, email: true, phone: true, isActive: true } },
              assignments: { orderBy: { createdAt: "desc" }, include: { clientProject: { select: { id: true, title: true, clientId: true } } } },
              _count: { select: { referrals: true } },
            },
          })
        : [],
    (canView[2] || canView[3] || canView[0]) && wantReferrals
      ? db.partnerReferral.findMany({
          orderBy: { createdAt: "desc" },
          take: scope === "overview" ? 8 : 250,
          include: {
            partner: { include: { user: { select: { name: true, email: true } } } },
            ambassador: { include: { user: { select: { name: true, email: true } } } },
          },
        })
      : [],
    canView[1] && wantPartners
      ? db.collaborationApplication.findMany({
          where: { type: "PARTNER" },
          orderBy: { createdAt: "desc" },
          include: { decidedBy: { select: { name: true, email: true } } },
        })
      : [],
    canView[0] && wantOverview
      ? Promise.all([
          db.user.count({ where: { OR: [{ role: "CLIENT" }, { clientEnabled: true }] } }),
          db.clientProject.count(),
          db.clientInvoice.count(),
          db.partnerReferral.count(),
          db.partner.count(),
          db.ambassador.count(),
        ])
      : Promise.resolve([0, 0, 0, 0, 0, 0]),
    canView[3] && wantProjects
      ? db.user.findMany({
          where: clientAccessWhere(),
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true, company: true },
        })
      : [],
    canView[3] && wantProjects
      ? db.clientProject.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            agreementDetails: true,
            financialPlan: true,
            stages: true,
            links: true,
            notes: true,
            status: true,
            progress: true,
            currency: true,
            dueAt: true,
            createdAt: true,
            client: { select: { id: true, name: true, email: true } },
            referral: {
              select: {
                ambassador: {
                  select: {
                    id: true,
                    user: { select: { name: true, email: true } },
                  },
                },
              },
            },
            partnerAssignments: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                status: true,
                progress: true,
                tasks: true,
                deliverables: true,
                feeAmount: true,
                feeCurrency: true,
                paymentStatus: true,
                dueAt: true,
                partner: {
                  select: {
                    id: true,
                    user: { select: { name: true, email: true } },
                  },
                },
              },
            },
          },
        })
      : [],
  ]);

  const projects = clientProjects.map((project) => {
    const assignments = project.partnerAssignments;
    const assignment = assignments[0];
    const ambassador = project.referral?.ambassador;
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      agreementDetails: project.agreementDetails,
      financialPlan: project.financialPlan,
      stages: project.stages,
      links: project.links,
      notes: project.notes,
      clientStatus: project.status,
      projectCurrency: project.currency,
      status: project.status,
      progress: project.progress,
      tasks: [...new Set(assignments.flatMap((item) => item.tasks))],
      deliverables: [...new Set(assignments.flatMap((item) => item.deliverables))],
      feeAmount: assignment?.feeAmount || null,
      feeCurrency: assignment?.feeCurrency || project.currency,
      paymentStatus: assignment?.paymentStatus || "PENDING",
      dueAt: project.dueAt,
      createdAt: project.createdAt,
      clientId: project.client.id,
      clientName: project.client.name || project.client.email,
      clientEmail: project.client.email,
      ambassador: ambassador ? {
        id: ambassador.id,
        name: ambassador.user.name || ambassador.user.email,
        email: ambassador.user.email,
      } : null,
      partnerIds: assignments.map((item) => item.partner.id),
      partners: assignments.map((item) => ({
        assignmentId: item.id,
        id: item.partner.id,
        name: item.partner.user.name || item.partner.user.email,
        email: item.partner.user.email,
        feeAmount: item.feeAmount,
        feeCurrency: item.feeCurrency,
        paymentStatus: item.paymentStatus,
      })),
    };
  });

  const stats = {
    clients: overviewStats[0],
    projects: overviewStats[1],
    invoices: overviewStats[2],
    referrals: overviewStats[3],
    partners: overviewStats[4],
    ambassadors: overviewStats[5],
  };

  return NextResponse.json({
    partners,
    applications,
    referrals,
    clients,
    projects,
    stats,
    access: { overview: canView[0], partners: canView[1], referrals: canView[2], projects: canView[3] },
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;
  const entity = body?.entity === "referral" ? "referral" : "partner";

  if (!id && body?.entity !== "project") {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  if (body?.entity === "application_review") {
    const access = await currentAdminAccess(request);
    if (!access || !(access.isOwner || access.permissions.includes("partners"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة طلبات الشركاء" }, { status: 403 });
    }
    const reviewState = textValue(body?.reviewState, 30);
    if (!["NEW", "IN_REVIEW", "NEEDS_INFO"].includes(reviewState)) {
      return NextResponse.json({ error: "حالة المراجعة غير صالحة" }, { status: 400 });
    }
    const existing = await db.collaborationApplication.findFirst({ where: { id, type: "PARTNER", status: "PENDING" }, select: { reviewState: true, name: true } });
    const updated = await db.collaborationApplication.updateMany({
      where: { id, type: "PARTNER", status: "PENDING" },
      data: { reviewState },
    });
    if (!updated.count) return NextResponse.json({ error: "الطلب غير موجود أو سبق اتخاذ قرار بشأنه" }, { status: 404 });
    await writeAdminAudit(db, { actorId: access.userId, action: reviewState === "NEEDS_INFO" ? "PARTNER_INFO_REQUESTED" : "PARTNER_REVIEW_STARTED", category: "NORMAL", entityType: "PARTNER_APPLICATION", entityId: id, entityLabel: existing?.name, before: { reviewState: existing?.reviewState || "NEW" }, after: { reviewState } });
    return NextResponse.json({ ok: true, reviewState });
  }

  if (body?.entity === "application") {
    const access = await currentAdminAccess(request);
    if (!access || !(access.isOwner || access.permissions.includes("partners"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    }
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "قرار غير صالح" }, { status: 400 });
    }

    try {
      const result = await decideCollaborationApplication({
        applicationId: id,
        type: "PARTNER",
        status,
        notes,
        password: typeof body?.password === "string" ? body.password : "",
        decidedById: access.userId,
      });

      if (status === "ACCEPTED" && result.userId && result.email && !result.idempotent) {
        const invitation = await sendClientInvitation(result.userId, result.email, request.nextUrl.origin).catch((error) => {
          console.error("[partner-acceptance] Invitation failed after account creation", error);
          return { sent: false, error: "EMAIL_SEND_FAILED" };
        });
        return NextResponse.json({
          ok: true,
          idempotent: false,
          invitationSent: invitation.sent,
          inviteError: invitation.error,
        });
      }

      return NextResponse.json({ ok: true, idempotent: Boolean(result.idempotent) });
    } catch (error) {
      if (error instanceof AcceptApplicationError) {
        return NextResponse.json({ error: error.code, message: acceptErrorMessage(error.code) }, { status: error.status });
      }
      throw error;
    }
  }

  if (body?.entity === "partner_profile") {
    if (!(await canAdmin(request, "partners"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    }
    const access = await currentAdminAccess(request);
    const partner = await db.partner.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
    if (!partner) return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });

    const specialty = textValue(body?.specialty, 1000);
    const experience = textValue(body?.experience, 5000);
    const availability = textValue(body?.availability, 1000);
    const portfolioUrl = textValue(body?.portfolioUrl, 500);
    if (portfolioUrl) {
      try {
        const url = new URL(portfolioUrl);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid");
      } catch {
        return NextResponse.json({ error: "رابط معرض الأعمال غير صالح" }, { status: 400 });
      }
    }

    try {
      const profile = await validatedAdminUserProfile({
        userId: partner.userId,
        name: body?.name,
        email: body?.email,
        phone: body?.phone,
      });
      const workAreas = stringList(body?.workAreas); const supportServices = stringList(body?.supportServices); const cooperationTypes = stringList(body?.cooperationTypes); const paymentMethods = stringList(body?.paymentMethods);
      const age = body?.age === "" || body?.age == null ? null : Number(body.age);
      const experienceYears = body?.experienceYears === "" || body?.experienceYears == null ? null : Number(body.experienceYears);
      const weeklyHours = body?.weeklyHours === "" || body?.weeklyHours == null ? null : Number(body.weeklyHours);
      if (age != null && (!Number.isInteger(age) || age < 1 || age > 120)) return NextResponse.json({ error: "العمر يجب أن يكون رقمًا صحيحًا بين 1 و120" }, { status: 400 });
      const completed = Boolean(profile.phone && (workAreas.length || specialty) && (body?.experienceLevel || experience) && (body?.availabilityType || availability));
      const updated = await db.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: partner.userId },
          data: profile,
          select: { name: true, email: true, phone: true, isActive: true },
        });
        const partnerProfile = await tx.partner.update({
          where: { id },
          data: {
            phone: profile.phone,
            age,
            educationLevel: textValue(body?.educationLevel, 120) || null,
            educationSpecialty: textValue(body?.educationSpecialty, 160) || null,
            specialty: specialty || null,
            experience: experience || null,
            availability: availability || null,
            portfolioUrl: portfolioUrl || null,
            contactMethod: textValue(body?.contactMethod, 1000) || null,
            workTypes: textValue(body?.workTypes, 3000) || null,
            payoutMethods: textValue(body?.payoutMethods, 3000) || null,
            countryRegion: textValue(body?.countryRegion, 200) || null,
            partnerType: textValue(body?.partnerType, 120) || null,
            workAreas, supportServices,
            experienceLevel: textValue(body?.experienceLevel, 120) || null,
            experienceYears: Number.isInteger(experienceYears) && experienceYears! >= 0 ? experienceYears : null,
            availabilityType: ["FULL_TIME", "PART_TIME"].includes(body?.availabilityType) ? body.availabilityType : null,
            weeklyHours: Number.isInteger(weeklyHours) && weeklyHours! > 0 ? weeklyHours : null,
            cooperationTypes,
            shortBio: textValue(body?.shortBio, 2000) || null,
            paymentMethods,
            otherPaymentMethod: textValue(body?.otherPaymentMethod, 120) || null,
            profileCompletedAt: completed ? partner.profileCompletedAt || new Date() : null,
          },
        });
        await writeAdminAudit(tx, { actorId: access?.userId, action: "PARTNER_PROFILE_UPDATED", category: "NORMAL", entityType: "PARTNER", entityId: id, entityLabel: profile.name, before: { name: partner.user.name, email: partner.user.email, phone: partner.user.phone, age: partner.age, educationLevel: partner.educationLevel, educationSpecialty: partner.educationSpecialty, specialty: partner.specialty, status: partner.status }, after: { name: profile.name, email: profile.email, phone: profile.phone, age, educationLevel: textValue(body?.educationLevel, 120) || null, educationSpecialty: textValue(body?.educationSpecialty, 160) || null, specialty, workAreas, supportServices, experienceYears, availabilityType: body?.availabilityType } });
        return { user, partner: partnerProfile };
      });
      return NextResponse.json(updated);
    } catch (error) {
      if (error instanceof AdminUserProfileError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  }

  if (body?.entity === "partner_note") {
    const access = await currentAdminAccess(request);
    if (!access || !(access.isOwner || access.permissions.includes("partners"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    }
    const note = textValue(body?.note, 2000);
    if (!note) return NextResponse.json({ error: "اكتب الملاحظة الإدارية أولًا" }, { status: 400 });
    const [partner, admin] = await Promise.all([
      db.partner.findUnique({ where: { id }, select: { adminNotes: true } }),
      db.user.findUnique({ where: { id: access.userId }, select: { name: true, email: true } }),
    ]);
    if (!partner) return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });
    const author = admin?.name || admin?.email || "الإدارة";
    const entry = `[${new Date().toISOString()}] ${author}: ${note}`;
    const adminNotes = partner.adminNotes ? `${partner.adminNotes}\n\n${entry}` : entry;
    await db.$transaction(async (tx) => { await tx.partner.update({ where: { id }, data: { adminNotes } }); await writeAdminAudit(tx, { actorId: access.userId, action: "PARTNER_NOTE_ADDED", category: "NORMAL", entityType: "PARTNER", entityId: id, entityLabel: author, after: { note } }); });
    return NextResponse.json({ ok: true, adminNotes });
  }

  if (body?.entity === "partner_assignment") {
    if (!(await canAdmin(request, "partners"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    }
    const projectId = textValue(body?.projectId, 100);
    if (!projectId) return NextResponse.json({ error: "اختر المشروع أولًا" }, { status: 400 });
    const [partner, project, existing] = await Promise.all([
      db.partner.findUnique({ where: { id }, include: { user: { select: { isActive: true } } } }),
      db.clientProject.findUnique({ where: { id: projectId } }),
      db.partnerProject.findFirst({ where: { partnerId: id, clientProjectId: projectId }, select: { id: true } }),
    ]);
    if (!partner) return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });
    if (partner.status !== "ACTIVE" || !partner.user.isActive) {
      return NextResponse.json({ error: "يجب تفعيل حساب الشريك قبل إسناد مشروع جديد" }, { status: 409 });
    }
    if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    if (existing) return NextResponse.json({ error: "المشروع مسند لهذا الشريك بالفعل" }, { status: 409 });

    const access = await currentAdminAccess(request);
    const assignment = await db.$transaction(async (tx) => { const created = await tx.partnerProject.create({ data: {
        partnerId: id,
        clientProjectId: project.id,
        title: project.title,
        description: project.description,
        status: project.status === "PLANNING" ? "ASSIGNED" : project.status,
        progress: project.progress,
        feeCurrency: project.currency,
        dueAt: project.dueAt,
      } }); await writeAdminAudit(tx, { actorId: access?.userId, action: "PARTNER_PROJECT_ASSIGNED", category: "POSITIVE", entityType: "PARTNER", entityId: id, entityLabel: project.title, after: { projectId: project.id, assignmentId: created.id } }); return created; });
    return NextResponse.json({ assignment }, { status: 201 });
  }

  if (body?.entity === "account") {
    if (!(await canAdmin(request, "partners"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
    }
    const partner = await db.partner.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!partner) return NextResponse.json({ error: "حساب الشريك غير موجود" }, { status: 404 });
    try {
      const profile = await validatedAdminUserProfile({ userId: partner.userId, name: body?.name, email: body?.email, phone: body?.phone });
      const updated = await db.$transaction(async (tx) => {
        const user = await tx.user.update({ where: { id: partner.userId }, data: profile, select: { name: true, email: true, phone: true, isActive: true } });
        await tx.partner.update({ where: { id: partner.id }, data: { phone: profile.phone } });
        return user;
      });
      return NextResponse.json({ user: updated });
    } catch (error) {
      if (error instanceof AdminUserProfileError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  }

  if (body?.entity === "project_update") {
    const access = await currentAdminAccess(request);
    if (!access || !(access.isOwner || access.permissions.includes("projects"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
    }

    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : id;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!projectId) return NextResponse.json({ error: "المشروع مطلوب" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });

    const allowedStatuses = ["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "CANCELLED"] as const;
    const projectStatus = typeof body?.projectStatus === "string" && (allowedStatuses as readonly string[]).includes(body.projectStatus)
      ? (body.projectStatus as ClientProjectStatus)
      : null;
    if (!projectStatus) return NextResponse.json({ error: "حالة المشروع غير صالحة" }, { status: 400 });

    const progress = Number(body?.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "نسبة التقدم يجب أن تكون بين 0 و100" }, { status: 400 });
    }

    const currency = typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : "";
    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: "رمز العملة غير صالح" }, { status: 400 });
    }

    const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: "موعد التسليم غير صالح" }, { status: 400 });
    }

    const parsedLinks = parseProjectLinks(body?.links);
    if (parsedLinks.invalid.length) {
      return NextResponse.json({ error: `الرابط غير صالح: ${parsedLinks.invalid[0]}` }, { status: 400 });
    }

    const existing = await db.clientProject.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, title: true, status: true, progress: true, currency: true, dueAt: true, partnerAssignments: { select: { id: true, partnerId: true } } },
    });
    if (!existing) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

    const requestedPartnerIds = partnerIdsFromBody(body);
    const existingPartnerIds = new Set(existing.partnerAssignments.map((assignment) => assignment.partnerId));
    const newPartnerIds = requestedPartnerIds.filter((partnerId) => !existingPartnerIds.has(partnerId));
    if (newPartnerIds.length) {
      const activePartners = await db.partner.count({ where: { id: { in: newPartnerIds }, status: "ACTIVE" } });
      if (activePartners !== newPartnerIds.length) {
        return NextResponse.json({ error: "أحد الشركاء المحددين غير موجود أو غير نشط" }, { status: 404 });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const clientProject = await tx.clientProject.update({
        where: { id: existing.id },
        data: {
          title,
          description: typeof body?.description === "string" ? body.description.trim() || null : null,
          agreementDetails: typeof body?.agreementDetails === "string" ? body.agreementDetails.trim() || null : null,
          financialPlan: typeof body?.financialPlan === "string" ? body.financialPlan.trim() || null : null,
          currency,
          stages: typeof body?.stages === "string" ? body.stages.trim() || null : null,
          links: parsedLinks.links,
          notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
          status: projectStatus,
          progress,
          dueAt,
        },
      });

      if (clientProject.status === "CANCELLED") {
        const futureStages = await tx.projectStage.findMany({ where: { projectId: clientProject.id, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } }, select: { id: true } });
        for (const stage of futureStages) {
          await tx.projectStage.update({ where: { id: stage.id }, data: { status: "CANCELLED", paymentStatus: "CANCELLED" } });
          await syncStageReward(tx, stage.id);
        }
        await writeAdminAudit(tx, { actorId: access.userId, action: "PROJECT_CANCELLED", category: "SENSITIVE", entityType: "CLIENT_PROJECT", entityId: clientProject.id, entityLabel: clientProject.title, after: { cancelledFutureStages: futureStages.length } });
      }

      if (existing.partnerAssignments.length) {
        await tx.partnerProject.updateMany({
          where: { clientProjectId: existing.id },
          data: {
            title,
            description: clientProject.description,
            status: projectStatus === "PLANNING" ? "ASSIGNED" : projectStatus,
            progress,
            dueAt,
          },
        });
      }

      for (const partnerId of newPartnerIds) {
        await tx.partnerProject.create({
          data: {
            partnerId,
            clientProjectId: existing.id,
            title,
            description: clientProject.description,
            status: projectStatus === "PLANNING" ? "ASSIGNED" : projectStatus,
            progress,
            feeCurrency: currency,
            dueAt,
          },
        });
      }

      await tx.clientNotification.create({
        data: {
          clientId: existing.clientId,
          title: "تم تحديث المشروع",
          body: `${title} — الإنجاز ${progress}%`,
          section: "projects",
        },
      });
      await writeAdminAudit(tx, { actorId: access.userId, action: "PROJECT_UPDATED", category: "NORMAL", entityType: "CLIENT_PROJECT", entityId: existing.id, entityLabel: title, before: { title: existing.title, status: existing.status, progress: existing.progress, currency: existing.currency, dueAt: existing.dueAt?.toISOString() || null, partnerIds: [...existingPartnerIds] }, after: { title, status: projectStatus, progress, currency, dueAt: dueAt?.toISOString() || null, partnerIds: requestedPartnerIds } });
      for (const assignedPartnerId of newPartnerIds) await writeAdminAudit(tx, { actorId: access.userId, action: "PARTNER_PROJECT_ASSIGNED", category: "POSITIVE", entityType: "PARTNER", entityId: assignedPartnerId, entityLabel: title, after: { projectId: existing.id } });
      return clientProject;
    });

    return NextResponse.json({ project: updated, assignmentsAdded: newPartnerIds.length });
  }

  if (body?.entity === "project") {
    const access = await currentAdminAccess(request);
    if (!access || !(access.isOwner || access.permissions.includes("projects"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
    }

    const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
    const partnerIds = partnerIdsFromBody(body, id);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!clientId) return NextResponse.json({ error: "العميل مطلوب" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });

    const client = await db.user.findFirst({
      where: clientAccessWhere(clientId),
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });

    const projectStatus = typeof body?.projectStatus === "string" ? body.projectStatus : "ASSIGNED";
    if (!["ASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "PLANNING", "CANCELLED"].includes(projectStatus)) {
      return NextResponse.json({ error: "حالة المشروع غير صالحة" }, { status: 400 });
    }

    const progress = body?.progress === undefined ? 0 : Number(body.progress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "نسبة التقدم يجب أن تكون بين 0 و100" }, { status: 400 });
    }

    const feeAmount =
      body?.feeAmount === undefined || body?.feeAmount === null || body?.feeAmount === ""
        ? null
        : String(body.feeAmount).trim();
    if (feeAmount && !/^\d{1,10}(\.\d{1,2})?$/.test(feeAmount)) {
      return NextResponse.json({ error: "قيمة المستحقات غير صالحة" }, { status: 400 });
    }

    const feeCurrency = typeof body?.feeCurrency === "string" ? body.feeCurrency.trim().toUpperCase() : "USD";
    if (!/^[A-Z]{3}$/.test(feeCurrency)) {
      return NextResponse.json({ error: "رمز العملة غير صالح" }, { status: 400 });
    }

    const paymentStatuses = ["PENDING", "APPROVED", "PAID", "CANCELLED"] as const;
    const paymentStatusValue = typeof body?.paymentStatus === "string" ? body.paymentStatus : "PENDING";
    if (!paymentStatuses.includes(paymentStatusValue as (typeof paymentStatuses)[number])) {
      return NextResponse.json({ error: "حالة المستحقات غير صالحة" }, { status: 400 });
    }
    const paymentStatus = paymentStatusValue as (typeof paymentStatuses)[number];

    const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: "موعد التسليم غير صالح" }, { status: 400 });
    }

    const clientStatus =
      projectStatus === "ASSIGNED" || projectStatus === "PLANNING"
        ? "PLANNING"
        : projectStatus === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : projectStatus === "REVIEW"
            ? "REVIEW"
            : projectStatus === "COMPLETED"
              ? "COMPLETED"
              : projectStatus === "CANCELLED"
                ? "CANCELLED"
                : "ON_HOLD";

    let activePartners: Array<{ id: string }> = [];
    if (partnerIds.length) {
      activePartners = await db.partner.findMany({
        where: { id: { in: partnerIds }, status: "ACTIVE" },
        select: { id: true },
      });
      if (activePartners.length !== partnerIds.length) {
        return NextResponse.json({ error: "أحد الشركاء المحددين غير موجود أو غير نشط" }, { status: 404 });
      }
    }

    const created = await db.$transaction(async (tx) => {
      const clientProject = await tx.clientProject.create({
        data: {
          clientId,
          title,
          description: typeof body.description === "string" ? body.description.trim() || null : null,
          agreementDetails: typeof body.agreementDetails === "string" ? body.agreementDetails.trim() || null : null,
          financialPlan: typeof body.financialPlan === "string" ? body.financialPlan.trim() || null : null,
          currency: feeCurrency,
          stages: typeof body.stages === "string" ? body.stages.trim() || null : null,
          links: stringList(body.links),
          notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
          status: clientStatus,
          progress,
          dueAt,
        },
      });

      const partnerProjects = await Promise.all(activePartners.map((partner) =>
        tx.partnerProject.create({
            data: {
              partnerId: partner.id,
              clientProjectId: clientProject.id,
              title,
              description: typeof body.description === "string" ? body.description.trim() || null : null,
              tasks: stringList(body.tasks),
              deliverables: stringList(body.deliverables),
              files: stringList(body.files),
              updates: stringList(body.updates),
              status: projectStatus === "PLANNING" ? "ASSIGNED" : projectStatus,
              progress,
              feeAmount,
              feeCurrency,
              paymentStatus,
              paidAt: paymentStatus === "PAID" ? new Date() : null,
              dueAt,
            },
          }),
      ));

      await tx.clientNotification.create({
        data: {
          clientId,
          title: "تمت إضافة مشروع جديد",
          body: title,
          section: "projects",
        },
      });

      await writeAdminAudit(tx, { actorId: access.userId, action: "PROJECT_CREATED", category: "POSITIVE", entityType: "CLIENT_PROJECT", entityId: clientProject.id, entityLabel: title, after: { clientId, status: clientStatus, progress, partnerIds } });
      for (const assignedPartnerId of partnerIds) await writeAdminAudit(tx, { actorId: access.userId, action: "PARTNER_PROJECT_ASSIGNED", category: "POSITIVE", entityType: "PARTNER", entityId: assignedPartnerId, entityLabel: title, after: { projectId: clientProject.id } });

      return { clientProject, partnerProjects };
    });

    return NextResponse.json({ project: created.clientProject, assignments: created.partnerProjects }, { status: 201 });
  }

  if (entity === "referral") {
    if (!(await canAdmin(request, "referrals"))) return NextResponse.json({ error: "لا تملك هذه الصلاحية" }, { status: 403 });
    if (!["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE", "NOT_INTERESTED"].includes(status)) {
      return NextResponse.json({ error: "حالة الإحالة غير صالحة" }, { status: 400 });
    }
    const referral = await db.partnerReferral.update({ where: { id }, data: { status } });
    return NextResponse.json({ referral });
  }

  const access = await currentAdminAccess(request);
  if (!access || !(access.isOwner || access.permissions.includes("partners"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
  if (!["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "حالة الشريك غير صالحة" }, { status: 400 });
  }
  const existingPartner = await db.partner.findUnique({ where: { id }, select: { id: true, userId: true, status: true, user: { select: { name: true, email: true, isActive: true } } } });
  if (!existingPartner) return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });
  const partner = await db.$transaction(async (tx) => {
    const updatedPartner = await tx.partner.update({ where: { id }, data: { status } });
    if (status === "ACTIVE" || status === "SUSPENDED") {
      await tx.user.update({ where: { id: existingPartner.userId }, data: { isActive: status === "ACTIVE" } });
    }
    await writeAdminAudit(tx, { actorId: access.userId, action: status === "ACTIVE" ? "PARTNER_ACCOUNT_ACTIVATED" : status === "SUSPENDED" ? "PARTNER_ACCOUNT_SUSPENDED" : "PARTNER_REVIEW_STARTED", category: status === "ACTIVE" ? "POSITIVE" : status === "SUSPENDED" ? "SENSITIVE" : "NORMAL", entityType: "PARTNER", entityId: id, entityLabel: existingPartner.user.name || existingPartner.user.email, before: { status: existingPartner.status, active: existingPartner.user.isActive }, after: { status, active: status === "ACTIVE" } });
    return updatedPartner;
  });
  return NextResponse.json({ partner });
}
