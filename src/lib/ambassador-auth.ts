import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

export async function currentAmbassador(request: NextRequest) {
  const session = readPartnerSession(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      ambassador: {
        select: {
          id: true,
          referralNumber: true,
          status: true,
          phone: true,
          country: true,
          contactMethod: true,
          payoutMethod: true,
          payoutDetails: true,
          profileCompletedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user?.isActive || !user.ambassador || user.ambassador.status !== "ACTIVE") {
    return null;
  }

  return user;
}
