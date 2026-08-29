import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

async function ambassadorFromToken(token?: string | null) {
  const session = readPartnerSession(token);
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

export async function currentAmbassador(request: NextRequest) {
  return ambassadorFromToken(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
}

export async function currentAmbassadorFromCookies() {
  const cookieStore = await cookies();
  return ambassadorFromToken(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
}
