import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { PARTNER_SESSION_COOKIE, readPartnerSession } from "@/lib/partner-auth";

async function clientAccessFromToken(token?: string | null) {
  const session = readPartnerSession(token);
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

export async function currentClientAccess(request: NextRequest) {
  return clientAccessFromToken(request.cookies.get(PARTNER_SESSION_COOKIE)?.value);
}

export async function currentClientAccessFromCookies() {
  const cookieStore = await cookies();
  return clientAccessFromToken(cookieStore.get(PARTNER_SESSION_COOKIE)?.value);
}
