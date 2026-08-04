import { NextRequest, NextResponse } from "next/server";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sendClientInvitation } from "@/lib/client-invitation";

type RouteContext = { params: Promise<{ clientId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { clientId } = await context.params;
  const client = await db.user.findFirst({ where: { id: clientId, role: "CLIENT" }, select: { id: true, email: true } });
  if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  const result = await sendClientInvitation(client.id, client.email, request.nextUrl.origin);
  if (!result.sent) return NextResponse.json({ error: result.error || "تعذر إرسال الدعوة", ...result }, { status: 503 });
  return NextResponse.json({ ok: true });
}
