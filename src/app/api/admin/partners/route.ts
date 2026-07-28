import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { NextRequest, NextResponse } from "next/server";
import { auditAdminAction } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  const canView = await Promise.all([
    canAdmin(request, "overview"),
    canAdmin(request, "partners"),
    canAdmin(request, "referrals"),
    canAdmin(request, "projects"),
  ]);
  if (!canView.some(Boolean)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const [partners, referrals, users] = await Promise.all([
    canView[1]
      ? db.partner.findMany({
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } }, _count: { select: { referrals: true } } },
        })
      : [],
    canView[2] || canView[3] || canView[0]
      ? db.partnerReferral.findMany({
          orderBy: { createdAt: "desc" },
          take: 250,
          include: { partner: { include: { user: { select: { name: true, email: true } } } } },
        })
      : [],
    canView[0] ? db.user.count() : 0,
  ]);

  const stats = {
    users,
    partners: partners.length,
    activePartners: partners.filter((item) => item.status === "ACTIVE").length,
    pendingPartners: partners.filter((item) => item.status === "PENDING").length,
    referrals: referrals.length,
    newReferrals: referrals.filter((item) => item.status === "NEW").length,
    qualifiedReferrals: referrals.filter((item) => item.status === "QUALIFIED").length,
    projects: referrals.filter((item) => item.status === "CONVERTED").length,
  };

  return NextResponse.json({
    partners,
    referrals,
    stats,
    access: { overview: canView[0], partners: canView[1], referrals: canView[2], projects: canView[3] },
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = body?.status;
  const entity = body?.entity === "referral" ? "referral" : "partner";

  if (!id) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });

  if (entity === "referral") {
    const permission = status === "CONVERTED" ? "projects" : "referrals";
    if (!(await canAdmin(request, permission))) return NextResponse.json({ error: "لا تملك هذه الصلاحية" }, { status: 403 });
    if (!["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "حالة الإحالة غير صالحة" }, { status: 400 });
    }
    const before = await db.partnerReferral.findUnique({ where: { id }, select: { id: true, name: true, email: true, status: true } });
    if (!before) return NextResponse.json({ error: "الإحالة غير موجودة" }, { status: 404 });
    const referral = await db.partnerReferral.update({ where: { id }, data: { status } });
    await auditAdminAction(request, {
      action: "UPDATE", entityType: "REFERRAL", entityId: referral.id, entityLabel: referral.name,
      summary: `غيّر حالة الإحالة ${referral.name}`,
      beforeData: { name: before.name, email: before.email, status: before.status },
      afterData: { name: referral.name, email: referral.email, status: referral.status },
    });
    return NextResponse.json({ referral });
  }

  if (!(await canAdmin(request, "partners"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة الشركاء" }, { status: 403 });
  if (!["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "حالة الشريك غير صالحة" }, { status: 400 });
  }
  const before = await db.partner.findUnique({ where: { id }, select: { id: true, referralNumber: true, status: true, user: { select: { name: true, email: true } } } });
  if (!before) return NextResponse.json({ error: "الشريك غير موجود" }, { status: 404 });
  const partner = await db.partner.update({ where: { id }, data: { status } });
  await auditAdminAction(request, {
    action: status === "ACTIVE" ? "ACTIVATE" : status === "SUSPENDED" ? "SUSPEND" : "UPDATE",
    entityType: "PARTNER", entityId: partner.id, entityLabel: before.user.name || before.user.email,
    summary: `غيّر حالة الشريك ${before.user.name || before.user.email}`,
    beforeData: { name: before.user.name, email: before.user.email, referralNumber: before.referralNumber, status: before.status },
    afterData: { name: before.user.name, email: before.user.email, referralNumber: before.referralNumber, status: partner.status },
  });
  return NextResponse.json({ partner });
}
