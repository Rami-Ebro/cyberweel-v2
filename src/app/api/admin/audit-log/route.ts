import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "audit_log"))) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() || "";
  const actorId = params.get("actorId")?.trim() || "";
  const action = params.get("action")?.trim() || "";
  const category = params.get("category")?.trim() || "";
  const from = params.get("from") ? new Date(`${params.get("from")}T00:00:00.000Z`) : null;
  const to = params.get("to") ? new Date(`${params.get("to")}T23:59:59.999Z`) : null;
  const where = {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
    ...(category ? { category } : {}),
    ...(from || to ? { createdAt: { ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}), ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}) } } : {}),
    ...(q ? { OR: [{ entityLabel: { contains: q, mode: "insensitive" as const } }, { entityId: { contains: q, mode: "insensitive" as const } }, { action: { contains: q, mode: "insensitive" as const } }, { actor: { is: { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } } }] } : {}),
  };
  const [logs, actors, actions] = await Promise.all([
    db.adminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 250, include: { actor: { select: { id: true, name: true, email: true } } } }),
    db.user.findMany({ where: { adminAuditLogs: { some: {} } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    db.adminAuditLog.findMany({ distinct: ["action"], orderBy: { action: "asc" }, select: { action: true } }),
  ]);
  return NextResponse.json({ logs, actors, actions: actions.map((item) => item.action) });
}
