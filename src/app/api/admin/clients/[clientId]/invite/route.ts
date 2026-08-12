import { NextRequest, NextResponse } from "next/server";
import { canAdmin } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { sendClientInvitation } from "@/lib/client-invitation";
import { clientAccessWhere } from "@/lib/user-identity";

type RouteContext = { params: Promise<{ clientId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { clientId } = await context.params;
  const client = await db.user.findFirst({ where: clientAccessWhere(clientId), select: { id: true, email: true, preferredLanguage: true } });
  if (!client) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  const result = await sendClientInvitation(client.id, client.email, request.nextUrl.origin, client.preferredLanguage === "en" ? "en" : "ar");
  if (!result.sent) return NextResponse.json({ error: result.error || "تعذر إرسال الدعوة", ...result }, { status: 503 });
  return NextResponse.json({ ok: true });
}
