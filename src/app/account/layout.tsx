import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { accountAccessSelect, hasUnifiedAccountAccess } from "@/lib/account-access";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) redirect("/login?next=/account/settings");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: accountAccessSelect,
  });

  if (!hasUnifiedAccountAccess(user)) redirect("/login?next=/account/settings");

  return children;
}
