import { NextRequest, NextResponse } from "next/server";
import { currentClientAccess } from "@/lib/client-access";
import { parseSubmissionLinks } from "@/lib/client-submissions";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const client = await currentClientAccess(request);
  if (!client) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const parsedLinks = parseSubmissionLinks(body?.links);
  if (!projectId) return NextResponse.json({ error: "اختر المشروع" }, { status: 400 });
  if (note.length > 2000) return NextResponse.json({ error: "الملاحظة أطول من الحد المسموح" }, { status: 400 });
  if (parsedLinks.tooMany) return NextResponse.json({ error: "يمكن إضافة 20 رابطًا كحد أقصى" }, { status: 400 });
  if (parsedLinks.invalid.length) return NextResponse.json({ error: `الرابط غير صالح: ${parsedLinks.invalid[0]}` }, { status: 400 });

  const project = await db.clientProject.findFirst({
    where: { id: projectId, clientId: client.id },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير متاح" }, { status: 404 });

  const submission = await db.clientSubmission.create({
    data: { projectId, note: note || null, links: parsedLinks.links, status: "UPLOADING" },
    select: { id: true },
  });
  return NextResponse.json({ submission }, { status: 201 });
}
