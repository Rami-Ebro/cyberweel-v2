import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { currentAdminAccess } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";
import { hasTrustedOrigin, invalidOriginResponse } from "@/lib/request-security";
import { getStagePartnerAssignment } from "@/lib/stage-partner-assignments";
import {
  createStagePartnerSubmission,
  listStagePartnerSubmissions,
  serializeStagePartnerSubmission,
  StagePartnerSubmissionError,
} from "@/lib/stage-partner-submissions";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ assignmentId: string }> };

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 30 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "pdf", "zip", "txt", "csv", "docx", "xlsx", "pptx"]);

async function currentPartnerId(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true, partner: { select: { id: true, status: true } } },
  });
  if (!user?.isActive || !user.partner || user.partner.status !== "ACTIVE") return null;
  return user.partner.id;
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "partner-delivery";
}

function linksFrom(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : "";
  const candidates = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
  const links: string[] = [];

  for (const item of candidates) {
    const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(item) ? item : `https://${item}`;
    try {
      const url = new URL(normalized);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
      links.push(url.toString());
    } catch {
      return null;
    }
  }
  return links;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { assignmentId } = await context.params;
  const assignment = await getStagePartnerAssignment(assignmentId);
  if (!assignment) return NextResponse.json({ error: "إسناد المرحلة غير موجود" }, { status: 404 });

  const [partnerId, admin] = await Promise.all([currentPartnerId(request), currentAdminAccess(request)]);
  const adminAllowed = Boolean(admin && (admin.isOwner || admin.permissions.includes("projects") || admin.permissions.includes("partners")));
  if (partnerId !== assignment.partnerId && !adminAllowed) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const submissions = await listStagePartnerSubmissions([assignmentId]);
  return NextResponse.json({ submissions: submissions.map(serializeStagePartnerSubmission) });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasTrustedOrigin(request)) return invalidOriginResponse();
  const partnerId = await currentPartnerId(request);
  if (!partnerId) return NextResponse.json({ error: "الحساب غير متاح" }, { status: 401 });

  const { assignmentId } = await context.params;
  const assignment = await getStagePartnerAssignment(assignmentId, partnerId);
  if (!assignment) return NextResponse.json({ error: "إسناد المرحلة غير موجود" }, { status: 404 });
  if (assignment.stageStatus === "NOT_STARTED") {
    return NextResponse.json({ error: "لا يمكن إرسال التسليم قبل أن تبدأ الإدارة هذه المرحلة" }, { status: 409 });
  }
  if (["COMPLETED", "CANCELLED"].includes(assignment.stageStatus) || ["COMPLETED", "CANCELLED"].includes(assignment.projectStatus)) {
    return NextResponse.json({ error: "المرحلة أو المشروع مغلق ولا يقبل تسليمات جديدة" }, { status: 409 });
  }
  if (assignment.status === "COMPLETED" || ["APPROVED", "PAID"].includes(assignment.paymentStatus)) {
    return NextResponse.json({ error: "اعتمدت الإدارة هذا التسليم بالفعل، ولا يمكن إرسال نسخة جديدة" }, { status: 409 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  try {
    const form = await request.formData();
    const note = String(form.get("note") || "").trim().slice(0, 4000) || null;
    const links = linksFrom(form.get("links"));
    if (links === null) return NextResponse.json({ error: "أحد روابط التسليم غير صالح. استخدم رابطًا صالحًا في كل سطر" }, { status: 400 });

    const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (!note && !links.length && !files.length) {
      return NextResponse.json({ error: "أرسل ملاحظة تسليم أو رابطًا أو ملفًا واحدًا على الأقل" }, { status: 400 });
    }
    if (files.length > MAX_FILES) return NextResponse.json({ error: "يمكن إرفاق 5 ملفات كحد أقصى في كل نسخة تسليم" }, { status: 400 });
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) return NextResponse.json({ error: "إجمالي ملفات التسليم يجب ألا يتجاوز 30 MB" }, { status: 400 });

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: `الملف «${file.name}» يتجاوز الحد الأقصى 10 MB` }, { status: 400 });
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXTENSIONS.has(extension) || (file.type && !ALLOWED_TYPES.has(file.type))) {
        return NextResponse.json({ error: `صيغة الملف «${file.name}» غير مدعومة` }, { status: 400 });
      }
    }
    if (files.length && !blobToken) return NextResponse.json({ error: "خدمة رفع ملفات التسليم غير مهيأة حاليًا" }, { status: 503 });

    const fileUrls: string[] = [];
    const fileNames: string[] = [];
    const fileTypes: string[] = [];
    for (const file of files) {
      const blob = await put(
        `partner-stage-submissions/${assignmentId}/${safeFileName(file.name)}`,
        file,
        {
          access: "private",
          token: blobToken!,
          addRandomSuffix: true,
          contentType: file.type || "application/octet-stream",
        },
      );
      fileUrls.push(blob.url);
      fileNames.push(file.name.slice(0, 180));
      fileTypes.push(file.type || "application/octet-stream");
    }

    const submission = await createStagePartnerSubmission({
      assignmentId,
      note,
      links,
      fileUrls,
      fileNames,
      fileTypes,
    });

    await db.adminNotification.create({
      data: {
        title: "تسليم شريك بانتظار المراجعة",
        body: `${assignment.partnerName || assignment.partnerEmail} — ${assignment.projectTitle} — ${assignment.stageName} — النسخة ${submission.version}`,
        href: "/admin/partners?section=projects",
        kind: "PARTNER_STAGE_REVIEW",
      },
    }).catch(() => undefined);

    return NextResponse.json({ submission: serializeStagePartnerSubmission(submission) }, { status: 201 });
  } catch (error) {
    if (error instanceof StagePartnerSubmissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[partner-stage-submission] failed", error);
    return NextResponse.json({ error: "تعذر إرسال التسليم. لم يتم اعتماد أي شيء" }, { status: 500 });
  }
}
