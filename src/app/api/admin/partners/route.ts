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

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  const canView = await Promise.all([
    canAdmin(request, "overview"),
    canAdmin(request, "partners"),
    canAdmin(request, "referrals"),
    canAdmin(request, "projects"),
  ]);
  if (!canView.some(Boolean)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

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
            partnerAssignment: {
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
    const assignment = project.partnerAssignment;
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
      status: assignment?.status || project.status,
      progress: assignment?.progress ?? project.progress,
      tasks: assignment?.tasks || [],
      deliverables: assignment?.deliverables || [],
      feeAmount: assignment?.feeAmount || null,
      feeCurrency: assignment?.feeCurrency || project.currency,
      paymentStatus: assignment?.paymentStatus || "PENDING",
      dueAt: assignment?.dueAt || project.dueAt,
      createdAt: project.createdAt,
      clientId: project.client.id,
      clientName: project.client.name || project.client.email,
      clientEmail: project.client.email,
      partnerId: assignment?.partner.id || null,
      partnerName: assignment?.partner.user.name || assignment?.partner.user.email || null,
      partnerEmail: assignment?.partner.user.email || null,
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

  if (body?.entity === "project_update") {
    if (!(await canAdmin(request, "projects"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
    }

    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : id;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!projectId) return NextResponse.json({ error: "المشروع مطلوب" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });

    const allowedStatuses = ["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"] as const;
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
      select: { id: true, clientId: true, partnerAssignment: { select: { id: true } } },
    });
    if (!existing) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

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

      if (existing.partnerAssignment) {
        await tx.partnerProject.update({
          where: { id: existing.partnerAssignment.id },
          data: {
            title,
            description: clientProject.description,
            status: projectStatus === "PLANNING" ? "ASSIGNED" : projectStatus,
            progress,
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
      return clientProject;
    });

    return NextResponse.json({ project: updated });
  }

  if (body?.entity === "project") {
    if (!(await canAdmin(request, "projects"))) {
      return NextResponse.json({ error: "لا تملك صلاحية إدارة المشاريع" }, { status: 403 });
    }

    const clientId = typeof body?.clientId === "string" ? body.clientId.trim() : "";
    const partnerId = typeof body?.partnerId === "string" ? body.partnerId.trim() : id;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!clientId) return NextResponse.json({ error: "العميل مطلوب" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });

    const client = await db.user.findFirst({
      where: clientAccessWhere(clientId),
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });

    const projectStatus = typeof body?.projectStatus === "string" ? body.projectStatus : "ASSIGNED";
    if (!["ASSIGNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD", "PLANNING"].includes(projectStatus)) {
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
              : "ON_HOLD";

    const stringList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((x: unknown): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : [];

    let partner = null as { id: string } | null;
    if (partnerId) {
      partner = await db.partner.findFirst({
        where: { id: partnerId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!partner) return NextResponse.json({ error: "الشريك غير موجود أو غير نشط" }, { status: 404 });
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

      const partnerProject = partner
        ? await tx.partnerProject.create({
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
          })
        : null;

      await tx.clientNotification.create({
        data: {
          clientId,
          title: "تمت إضافة مشروع جديد",
          body: title,
          section: "projects",
        },
      });

      return { clientProject, partnerProject };
    });

    return NextResponse.json({ project: created.clientProject, assignment: created.partnerProject }, { status: 201 });
  }

  if (entity === "referral") {
    if (!(await canAdmin(request, "referrals"))) return NextResponse.json({ error: "لا تملك هذه الصلاحية" }, { status: 403 });
    if (!["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE", "NOT_INTERESTED"].includes(status)) {
      return NextResponse.json({ error: "حالة الإحالة غير صالحة" }, { status: 400 });
    }
    const referral = await db.partnerReferral.update({ where: { id }, data: { status } });
    return NextResponse.json({ referral });
  }

  if (!(await canAdmin(request, "partners"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
  if (!["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "حالة الشريك غير صالحة" }, { status: 400 });
  }
  const partner = await db.partner.update({ where: { id }, data: { status } });
  return NextResponse.json({ partner });
}
