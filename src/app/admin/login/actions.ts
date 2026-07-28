"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  REMEMBERED_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createSessionToken,
  getClientKey,
  verifyOwnerCredentials,
} from "@/lib/admin-auth";
import { consumeRateLimitSubject } from "@/lib/request-security";

export type LoginActionState = {
  message: string;
  status: "idle" | "error";
};

export async function loginOwner(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const rememberValue = formData.get("remember");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const remember = rememberValue === "on";

  const clientKey = await getClientKey();
  const rateLimit = await consumeRateLimitSubject({
    action: "legacy-owner-login",
    subject: `${clientKey}:${email.toLowerCase()}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "محاولات كثيرة. انتظر 15 دقيقة ثم حاول مجددًا.",
    };
  }

  if (!email || !password || !verifyOwnerCredentials(email, password)) {
    return { status: "error", message: "بيانات الدخول غير صحيحة." };
  }

  const maxAge = remember
    ? REMEMBERED_SESSION_TTL_SECONDS
    : SESSION_TTL_SECONDS;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(maxAge), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high",
  });

  redirect("/admin/smart-links");
}

export async function logoutOwner(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    priority: "high",
  });

  redirect("/admin/login");
}
