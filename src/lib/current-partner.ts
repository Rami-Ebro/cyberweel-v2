import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export async function getCurrentPartner() {
  const cookieStore = await cookies();
  const session = readPartnerSession(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.userId },
    include: {
      partner: {
        include: {
          referrals: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
}
