import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { NextRequest, NextResponse } from "next/server";

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
