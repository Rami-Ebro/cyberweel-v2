import { NextRequest, NextResponse } from "next/server";
import { currentClientAccess } from "@/lib/client-access";
import {
  cleanSubmissionFilename,
  isVercelBlobUrl,
  MAX_SUBMISSION_FILES,
  MAX_SUBMISSION_FILE_SIZE,
} from "@/lib/client-submissions";
import { db } from "@/lib/db";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ submissionId: string }> };

type UploadedFile = { url: string; name: string; size: number };

export async function POST(request: NextRequest, context: RouteContext) {
  const client = await currentClientAccess(request);
  if (!client) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { submissionId } = await context.params;
  const body = await request.json().catch(() => null);
  const files = Array.isArray(body?.files) ? body.files as UploadedFile[] : [];
  if (files.length > MAX_SUBMISSION_FILES || files.some((file) =>
    typeof file?.url !== "string" || !isVercelBlobUrl(file.url) || typeof file?.name !== "string" || !Number.isFinite(Number(file.size)) || Number(file.size) <= 0 || Number(file.size) > MAX_SUBMISSION_FILE_SIZE
  )) return NextResponse.json({ error: "قائمة الملفات غير صالحة" }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const submission = await tx.clientSubmission.findFirst({
        where: { id: submissionId, project: { clientId: client.id } },
        include: { project: { select: { id: true, title: true } }, files: { select: { id: true, url: true } } },
      });
      if (!submission) throw new Error("NOT_FOUND");
      if (submission.status !== "UPLOADING") return { submission, idempotent: true };

      const urls = new Set(submission.files.map((file) => file.url));
      const missing = files.filter((file) => !urls.has(file.url));
      if (submission.files.length + missing.length > MAX_SUBMISSION_FILES) throw new Error("TOO_MANY_FILES");
      for (const file of missing) {
        await tx.clientFile.create({
          data: {
            projectId: submission.projectId,
            submissionId: submission.id,
            name: cleanSubmissionFilename(file.name),
            url: file.url,
            kind: "CLIENT_SUBMISSION",
            size: Math.round(Number(file.size)),
            storageProvider: "VERCEL_BLOB",
            source: "CLIENT",
          },
        });
      }
      if (!submission.note && !submission.links.length && submission.files.length + missing.length === 0) throw new Error("EMPTY");

      const completed = await tx.clientSubmission.update({ where: { id: submission.id }, data: { status: "RECEIVED" } });
      await tx.adminNotification.create({
        data: {
          title: "مواد جديدة من عميل",
          body: `${client.name || client.email} — ${submission.project.title}`,
          href: `/admin/clients/${client.id}?manage=files`,
          kind: "CLIENT_SUBMISSION",
        },
      });
      return { submission: completed, idempotent: false };
    });
    return NextResponse.json({ submission: result.submission, idempotent: result.idempotent });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, [string, number]> = {
      NOT_FOUND: ["الإرسال غير موجود", 404],
      TOO_MANY_FILES: ["تم تجاوز حد الملفات", 400],
      EMPTY: ["أضف ملفًا أو رابطًا أو ملاحظة قبل الإرسال", 400],
    };
    const [message, status] = messages[code] || ["تعذر إكمال الإرسال", 409];
    return NextResponse.json({ error: message }, { status });
  }
}
