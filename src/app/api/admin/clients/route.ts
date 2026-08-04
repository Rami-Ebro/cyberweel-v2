import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import { sendClientInvitation } from "@/lib/client-invitation";

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });

  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      preferredLanguage: true,
      clientSource: true,
      internalNotes: true,
      isActive: true,
      passwordHash: true,
      createdAt: true,
      clientProjects: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, progress: true },
      },
    },
  });
  return NextResponse.json({
    clients: clients.map(({ passwordHash, ...client }) => ({ ...client, hasLogin: Boolean(passwordHash) })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const phone = typeof body?.phone === "string" ? normalizePhone(body.phone) : "";
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  const preferredLanguage = body?.preferredLanguage === "en" ? "en" : "ar";
  const clientSource = typeof body?.clientSource === "string" ? body.clientSource.trim() : "";
  const internalNotes = typeof body?.internalNotes === "string" ? body.internalNotes.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const referralId = typeof body?.referralId === "string" ? body.referralId : "";
  const sendInvite = body?.sendInvite === true;
  const confirmPhoneDuplicate = body?.confirmPhoneDuplicate === true;
  const isActive = body?.isActive !== false;

  if (name.length < 2 || !email.includes("@") || email.length > 254) {
    return NextResponse.json({ error: "الاسم والبريد الإلكتروني الصحيح مطلوبان" }, { status: 400 });
  }
  if (phone && phone.length < 8) return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
  if (password && password.length < 8) return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });

  const [emailOwner, phoneOwner, referral] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true, role: true, name: true, email: true, phone: true, company: true, preferredLanguage: true, clientSource: true, internalNotes: true, isActive: true } }),
    phone ? db.user.findFirst({ where: { phone }, select: { id: true, role: true, name: true, email: true } }) : null,
    referralId ? db.partnerReferral.findUnique({ where: { id: referralId }, select: { id: true, status: true, adminDecision: true, convertedClientId: true } }) : null,
  ]);

  if (emailOwner && emailOwner.role !== "CLIENT") {
    return NextResponse.json({ error: "البريد مرتبط بحساب من نوع آخر" }, { status: 409 });
  }
  if (emailOwner && !referralId) {
    return NextResponse.json({ error: "يوجد عميل مسجل بهذا البريد بالفعل", clientId: emailOwner.id }, { status: 409 });
  }
  if (referralId && (!referral || !["INTERESTED", "CONVERTED"].includes(referral.status))) {
    return NextResponse.json({ error: "الإحالة يجب أن تكون مهتمة ومقبولة قبل تحويلها" }, { status: 409 });
  }
  if (referralId && referral?.adminDecision !== "ACCEPTED") {
    return NextResponse.json({ error: "يجب اعتماد قرار الإحالة قبل تحويلها" }, { status: 409 });
  }
  if (referral?.convertedClientId) {
    return NextResponse.json({ error: "تم تحويل هذه الإحالة مسبقًا", clientId: referral.convertedClientId }, { status: 409 });
  }
  if (phoneOwner && phoneOwner.id !== emailOwner?.id && !confirmPhoneDuplicate) {
    return NextResponse.json({
      error: "PHONE_MATCH_REQUIRES_CONFIRMATION",
      phoneMatch: { id: phoneOwner.id, name: phoneOwner.name, email: phoneOwner.email, role: phoneOwner.role },
    }, { status: 409 });
  }

  try {
    const client = await db.$transaction(async (tx) => {
      const savedClient = emailOwner
        ? await tx.user.update({
            where: { id: emailOwner.id },
            data: {
              name: emailOwner.name || name,
              phone: emailOwner.phone || phone || null,
              company: emailOwner.company || company || null,
              preferredLanguage: emailOwner.preferredLanguage || preferredLanguage,
              clientSource: emailOwner.clientSource || clientSource || "REFERRAL",
              internalNotes: emailOwner.internalNotes || internalNotes || null,
              isActive: emailOwner.isActive,
            },
          })
        : await tx.user.create({
            data: {
              name,
              email,
              phone: phone || null,
              company: company || null,
              preferredLanguage,
              clientSource: clientSource || (referralId ? "REFERRAL" : "DIRECT"),
              internalNotes: internalNotes || null,
              passwordHash: password ? hashPassword(password) : null,
              role: "CLIENT",
              isActive,
            },
          });

      if (referralId) {
        await tx.partnerReferral.update({
          where: { id: referralId },
          data: { status: "CONVERTED", adminDecision: "CONVERTED_TO_CLIENT", convertedClientId: savedClient.id, convertedAt: new Date() },
        });
      }
      return savedClient;
    });

    const shouldSendInvite = sendInvite && !emailOwner;
    const invitation = shouldSendInvite
      ? await sendClientInvitation(client.id, client.email, request.nextUrl.origin)
      : { sent: false, error: undefined, invitationUrl: undefined };
    return NextResponse.json({
      client: { id: client.id, name: client.name, email: client.email, phone: client.phone, isActive: client.isActive },
      reusedExistingClient: Boolean(emailOwner),
      inviteRequested: shouldSendInvite,
      inviteSent: invitation.sent,
      ...(invitation.error ? { inviteError: invitation.error } : {}),
      ...(invitation.invitationUrl ? { invitationUrl: invitation.invitationUrl } : {}),
    }, { status: emailOwner ? 200 : 201 });
  } catch (error) {
    console.error("[admin-clients] Failed to save client", error);
    return NextResponse.json({ error: "تعذر حفظ العميل" }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : undefined;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!userId) return NextResponse.json({ error: "حساب العميل مطلوب" }, { status: 400 });
  if (password && password.length < 8) return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });

  const client = await db.user.findFirst({ where: { id: userId, role: "CLIENT" }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "حساب العميل غير موجود" }, { status: 404 });
  const updated = await db.user.update({
    where: { id: client.id },
    data: { ...(isActive !== undefined ? { isActive } : {}), ...(password ? { passwordHash: hashPassword(password) } : {}) },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });
  return NextResponse.json({ client: updated });
}
