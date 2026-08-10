import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { NextRequest, NextResponse } from "next/server";
import { clientAccessWhere } from "@/lib/user-identity";

async function currentClient(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findFirst({
    where: clientAccessWhere(session.userId),
    select: { id: true },
  });
}

export async function POST(request: NextRequest) {
  const client = await currentClient(request);
  if (!client) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";

  if (messageBody.length < 2 || messageBody.length > 5000) {
    return NextResponse.json({ error: "اكتب رسالة بين حرفين و5000 حرف" }, { status: 400 });
  }

  if (projectId) {
    const project = await db.clientProject.findFirst({
      where: { id: projectId, clientId: client.id },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "المشروع المحدد غير متاح" }, { status: 400 });
  }

  const message = await db.clientMessage.create({
    data: {
      clientId: client.id,
      projectId: projectId || null,
      subject: subject || null,
      body: messageBody,
      fromAdmin: false,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
