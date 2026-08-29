import { head } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentClientAccess } from "@/lib/client-access";
import {
  cleanSubmissionFilename,
  clientSubmissionBlobPrefix,
  isExpectedClientSubmissionBlobUrl,
  MAX_SUBMISSION_FILES,
  MAX_SUBMISSION_FILE_SIZE,
} from "@/lib/client-submissions";
import { db } from "@/lib/db";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ submissionId: string }> };

type UploadedFile = { url: string; name: string; size: number };
type ValidatedFile = UploadedFile & { cleanName: string; actualSize: number };

export async function POST(request: NextRequest, context: RouteContext) {
  const client = await currentClientAccess(request);
  if (!client) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { submissionId } = await context.params;
  const body = await request.json().catch(() => null);
  const files = Array.isArray(body?.files) ? body.files as UploadedFile[] : [];
  if (files.length > MAX_SUBMISSION_FILES || files.some((file) =>
    typeof file?.url !== "string" || typeof file?.name !== "string" || !Number.isFinite(Number(file.size)) || Number(file.size) <= 0 || Number(file.size) > MAX_SUBMISSION_FILE_SIZE
  )) return NextResponse.json({ error: "قائمة الملفات غير صالحة" }, { status: 400 });

  if (new Set(files.map((file) => file.url)).size !== files.length) {
    return NextResponse.json({ error: "قائمة الملفات تحتوي على روابط مكررة" }, { status: 400 });
  }

  const initialSubmission = await db.clientSubmission.findFirst({
    where: { id: submissionId, project: { clientId: client.id } },
    include: { project: { select: { id: true, title: true } } },
  });
  if (!initialSubmission) return NextResponse.json({ error: "الإرسال غير موجود" }, { status: 404 });
  if (initialSubmission.status !== "UPLOADING") {
    return NextResponse.json({ submission: initialSubmission, idempotent: true });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (files.length && !blobToken) {
    return NextResponse.json({ error: "خدمة التحقق من الملفات غير مهيأة حاليًا" }, { status: 503 });
  }

  const expectedPrefix = clientSubmissionBlobPrefix(client.id, initialSubmission.id);
  const validatedFiles: ValidatedFile[] = [];
  try {
    for (const file of files) {
      if (!isExpectedClientSubmissionBlobUrl(file.url, client.id, initialSubmission.id)) {
        throw new Error("INVALID_BLOB_OWNERSHIP");
      }

      const details = await head(file.url, { token: blobToken });
      if (
        details.url !== file.url
        || !details.pathname.startsWith(expectedPrefix)
        || details.size <= 0
        || details.size > MAX_SUBMISSION_FILE_SIZE
        || details.size !== Math.round(Number(file.size))
      ) {
        throw new Error("INVALID_BLOB_OWNERSHIP");
      }

      validatedFiles.push({
        ...file,
        cleanName: cleanSubmissionFilename(file.name),
        actualSize: details.size,
      });
    }
  } catch (error) {
    console.error("[client-submission-complete] Blob ownership validation failed", error);
    return NextResponse.json({ error: "أحد الملفات لا يخص هذا العميل أو هذا الإرسال، أو لم يُرفع عبر المسار المعتمد" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const claimed = await tx.clientSubmission.updateMany({
        where: { id: submissionId, status: "UPLOADING", project: { clientId: client.id } },
        data: { status: "PROCESSING" },
      });
      if (claimed.count !== 1) {
        const current = await tx.clientSubmission.findFirst({
          where: { id: submissionId, project: { clientId: client.id } },
          include: { project: { select: { id: true, title: true } } },
        });
        if (!current) throw new Error("NOT_FOUND");
        return { submission: current, idempotent: true };
      }

      const submission = await tx.clientSubmission.findFirst({
        where: { id: submissionId, status: "PROCESSING", project: { clientId: client.id } },
        include: {
          project: { select: { id: true, title: true } },
          files: {
            select: {
              id: true,
              projectId: true,
              submissionId: true,
              name: true,
              url: true,
              kind: true,
              size: true,
              storageProvider: true,
              source: true,
            },
          },
        },
      });
      if (!submission) throw new Error("NOT_FOUND");
      if (submission.files.length > MAX_SUBMISSION_FILES) throw new Error("TOO_MANY_FILES");

      const filesByUrl = new Map(submission.files.map((file) => [file.url, file]));
      let inserted = 0;
      for (const file of validatedFiles) {
        const existing = filesByUrl.get(file.url);
        if (existing) {
          const validExisting = existing.projectId === submission.projectId
            && existing.submissionId === submission.id
            && existing.source === "CLIENT"
            && existing.storageProvider === "VERCEL_BLOB"
            && existing.kind === "CLIENT_SUBMISSION"
            && isExpectedClientSubmissionBlobUrl(existing.url, client.id, submission.id);
          if (!validExisting) throw new Error("INVALID_BLOB_OWNERSHIP");

          const duplicateElsewhere = await tx.clientFile.findFirst({
            where: { url: file.url, id: { not: existing.id } },
            select: { id: true },
          });
          if (duplicateElsewhere) throw new Error("INVALID_BLOB_OWNERSHIP");
          if (existing.size !== file.actualSize) {
            await tx.clientFile.update({ where: { id: existing.id }, data: { size: file.actualSize } });
          }
          continue;
        }

        const linkedElsewhere = await tx.clientFile.findFirst({
          where: { url: file.url },
          select: { projectId: true, submissionId: true, source: true },
        });
        if (linkedElsewhere) throw new Error("INVALID_BLOB_OWNERSHIP");
        if (submission.files.length + inserted + 1 > MAX_SUBMISSION_FILES) throw new Error("TOO_MANY_FILES");

        const created = await tx.clientFile.create({
          data: {
            projectId: submission.projectId,
            submissionId: submission.id,
            name: file.cleanName,
            url: file.url,
            kind: "CLIENT_SUBMISSION",
            size: file.actualSize,
            storageProvider: "VERCEL_BLOB",
            source: "CLIENT",
          },
        });
        filesByUrl.set(file.url, created);
        inserted += 1;
      }

      if (!submission.note && !submission.links.length && submission.files.length + inserted === 0) throw new Error("EMPTY");

      const completed = await tx.clientSubmission.update({
        where: { id: submission.id },
        data: { status: "RECEIVED" },
      });
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
      INVALID_BLOB_OWNERSHIP: ["أحد الملفات لا يخص هذا العميل أو هذا الإرسال، أو لم يُرفع عبر المسار المعتمد", 400],
    };
    const [message, status] = messages[code] || ["تعذر إكمال الإرسال", 409];
    return NextResponse.json({ error: message }, { status });
  }
}
