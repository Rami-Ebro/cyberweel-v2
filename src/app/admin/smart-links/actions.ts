"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/admin-auth";
import { db } from "@/lib/db";

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
  await requireOwner();

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
    await db.smartLink.create({
      data: { title, slug, destinationUrl },
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
  await requireOwner();

  const id = text(formData, "id");
  const destinationUrl = text(formData, "destinationUrl");

  if (!id || !validateDestinationUrl(destinationUrl)) {
    return {
      status: "error",
      message: "أدخل رابط وجهة صحيحًا يبدأ بـ http أو https.",
    };
  }

  try {
    await db.smartLink.update({
      where: { id },
      data: { destinationUrl },
    });
    revalidatePath("/admin/smart-links");
    return { status: "success", message: "تم تحديث الوجهة." };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleSmartLink(formData: FormData) {
  await requireOwner();

  const id = text(formData, "id");
  const nextState = text(formData, "nextState") === "true";

  if (!id) return;

  await db.smartLink.update({
    where: { id },
    data: { isActive: nextState },
  });
  revalidatePath("/admin/smart-links");
}
