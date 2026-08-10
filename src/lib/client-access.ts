import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export async function currentClientAccess(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findFirst({
    where: {
      id: session.userId,
      isActive: true,
      OR: [{ role: "CLIENT" }, { clientEnabled: true }],
    },
    select: { id: true, name: true, email: true },
  });
}
