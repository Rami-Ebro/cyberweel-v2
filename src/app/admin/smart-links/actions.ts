"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { auditOwnerServerAction } from "@/lib/audit-log";

export type SmartLinkActionState = {
  message: string;
  status: "idle" | "success" | "error";
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateDestinationUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function actionError(error: unknown): SmartLinkActionState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      status: "error",
      message: "هذا المعرّف مستخدم بالفعل. اختر معرّفًا آخر.",
    };
  }

  console.error("Smart Links action failed", error);
  return {
    status: "error",
    message: "تعذّر حفظ التغيير. حاول مرة أخرى.",
  };
}

export async function createSmartLink(
  _previousState: SmartLinkActionState,
  formData: FormData,
): Promise<SmartLinkActionState> {
  await requireAdminPermission("smart_links");

  const title = text(formData, "title");
  const slug = text(formData, "slug").toLowerCase();
  const destinationUrl = text(formData, "destinationUrl");

  if (!title || !slug || !destinationUrl) {
    return { status: "error", message: "أكمل جميع الحقول المطلوبة." };
  }

  if (!slugPattern.test(slug)) {
    return {
      status: "error",
      message: "المعرّف يقبل أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.",
    };
  }

  if (!validateDestinationUrl(destinationUrl)) {
    return {
      status: "error",
      message: "أدخل رابط وجهة صحيحًا يبدأ بـ http أو https.",
    };
  }

  try {
    const created = await db.smartLink.create({
      data: { title, slug, destinationUrl },
    });
    await auditOwnerServerAction({
      action: "CREATE", entityType: "SMART_LINK", entityId: created.id, entityLabel: created.title,
      summary: `أنشأ الرابط الذكي ${created.title}`,
      afterData: { title: created.title, slug: created.slug, destinationUrl: created.destinationUrl, isActive: created.isActive },
    });
    revalidatePath("/admin/smart-links");
    return { status: "success", message: "تم إنشاء الرابط بنجاح." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateSmartLinkDestination(
  _previousState: SmartLinkActionState,
  formData: FormData,
): Promise<SmartLinkActionState> {
  await requireAdminPermission("smart_links");

  const id = text(formData, "id");
  const destinationUrl = text(formData, "destinationUrl");

  if (!id || !validateDestinationUrl(destinationUrl)) {
    return {
      status: "error",
      message: "أدخل رابط وجهة صحيحًا يبدأ بـ http أو https.",
    };
  }

  try {
    const before = await db.smartLink.findUnique({ where: { id }, select: { title: true, slug: true, destinationUrl: true, isActive: true } });
    const updated = await db.smartLink.update({
      where: { id },
      data: { destinationUrl },
    });
    await auditOwnerServerAction({
      action: "UPDATE", entityType: "SMART_LINK", entityId: updated.id, entityLabel: updated.title,
      summary: `عدّل وجهة الرابط الذكي ${updated.title}`,
      beforeData: before || undefined,
      afterData: { title: updated.title, slug: updated.slug, destinationUrl: updated.destinationUrl, isActive: updated.isActive },
    });
    revalidatePath("/admin/smart-links");
    return { status: "success", message: "تم تحديث الوجهة." };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleSmartLink(formData: FormData) {
  await requireAdminPermission("smart_links");

  const id = text(formData, "id");
  const nextState = text(formData, "nextState") === "true";

  if (!id) return;

  const before = await db.smartLink.findUnique({ where: { id }, select: { title: true, slug: true, destinationUrl: true, isActive: true } });
  const updated = await db.smartLink.update({
    where: { id },
    data: { isActive: nextState },
  });
  await auditOwnerServerAction({
    action: nextState ? "ACTIVATE" : "SUSPEND", entityType: "SMART_LINK", entityId: updated.id, entityLabel: updated.title,
    summary: `${nextState ? "فعّل" : "عطّل"} الرابط الذكي ${updated.title}`,
    beforeData: before || undefined,
    afterData: { title: updated.title, slug: updated.slug, destinationUrl: updated.destinationUrl, isActive: updated.isActive },
  });
  revalidatePath("/admin/smart-links");
}

export async function deleteSmartLink(formData: FormData) {
  await requireAdminPermission("smart_links");

  const id = text(formData, "id");
  if (!id) return;

  const smartLink = await db.smartLink.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, destinationUrl: true, isActive: true },
  });

  if (!smartLink || smartLink.isActive) return;

  await db.smartLink.delete({ where: { id } });
  await auditOwnerServerAction({
    action: "DELETE", entityType: "SMART_LINK", entityId: smartLink.id, entityLabel: smartLink.title,
    summary: `حذف الرابط الذكي ${smartLink.title}`,
    beforeData: { title: smartLink.title, slug: smartLink.slug, destinationUrl: smartLink.destinationUrl, isActive: smartLink.isActive },
  });
  revalidatePath("/admin/smart-links");
}
