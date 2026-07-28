import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";

const PAGE_SIZE = 50;

function validDate(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: NextRequest) {
  const access = await currentAdminAccess(request);
  if (!access?.isOwner) return NextResponse.json({ error: "سجل النشاط متاح للمالك فقط" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const action = params.get("action")?.trim() || "";
  const entityType = params.get("entityType")?.trim() || "";
  const actor = params.get("actor")?.trim() || "";
  const search = params.get("search")?.trim().slice(0, 120) || "";
  const from = validDate(params.get("from"));
  const to = validDate(params.get("to"), true);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(actor ? { actorEmail: actor } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(search ? {
      OR: [
        { summary: { contains: search, mode: "insensitive" } },
        { entityLabel: { contains: search, mode: "insensitive" } },
        { actorName: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  };

  const [logs, total, actors, entityTypes] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      distinct: ["actorEmail"],
      orderBy: { actorEmail: "asc" },
      select: { actorEmail: true, actorName: true },
    }),
    db.auditLog.findMany({
      distinct: ["entityType"],
      orderBy: { entityType: "asc" },
      select: { entityType: true },
    }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    actors,
    entityTypes: entityTypes.map((item) => item.entityType),
  });
}
