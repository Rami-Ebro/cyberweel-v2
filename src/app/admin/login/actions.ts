"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  clearAttempts,
  createSessionToken,
  getClientKey,
  isRateLimited,
  recordFailedAttempt,
  verifyOwnerCredentials,
} from "@/lib/admin-auth";

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
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  const clientKey = await getClientKey();

  if (isRateLimited(clientKey)) {
    return {
      status: "error",
      message: "محاولات كثيرة. انتظر 15 دقيقة ثم حاول مجددًا.",
    };
  }

  if (!email || !password || !verifyOwnerCredentials(email, password)) {
    recordFailedAttempt(clientKey);
    // Never log emails, passwords, hashes, or tokens.
    return { status: "error", message: "بيانات الدخول غير صحيحة." };
  }

  clearAttempts(clientKey);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
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
  });

  redirect("/admin/login");
}
