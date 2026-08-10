import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canAdmin } from "@/lib/admin-permissions";
import { hashPassword, normalizeEmail, normalizePhone } from "@/lib/partner-auth";
import { sendClientInvitation } from "@/lib/client-invitation";
import {
  findNameConflict,
  NAME_TAKEN_MESSAGE,
  normalizeDisplayName,
} from "@/lib/user-identity";

export async function GET(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });
  }

  const clients = await db.user.findMany({
    where: { OR: [{ role: "CLIENT" }, { clientEnabled: true }] },
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
    clients: clients.map(({ passwordHash, ...client }) => ({
      ...client,
      hasLogin: Boolean(passwordHash),
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? normalizeDisplayName(body.name) : "";
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
  if (password && password.length < 8) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }

  const [emailOwner, phoneOwner, referral, nameConflict] = await Promise.all([
    db.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        preferredLanguage: true,
        clientSource: true,
        internalNotes: true,
        isActive: true,
        clientEnabled: true,
        adminProfile: { select: { id: true } },
      },
    }),
    phone ? db.user.findFirst({ where: { phone }, select: { id: true, role: true, name: true, email: true } }) : null,
    referralId
      ? db.partnerReferral.findUnique({
          where: { id: referralId },
          select: { id: true, status: true, adminDecision: true, convertedClientId: true },
        })
      : null,
    findNameConflict(name),
  ]);

  if (emailOwner?.adminProfile || emailOwner?.role === "ADMIN") {
    return NextResponse.json({ error: "البريد مرتبط بحساب إدارة ولا يمكن تحويله لعميل" }, { status: 409 });
  }

  if (emailOwner && (emailOwner.role === "CLIENT" || emailOwner.clientEnabled) && !referralId) {
    return NextResponse.json(
      { error: "يوجد عميل مسجل بهذا البريد بالفعل", clientId: emailOwner.id },
      { status: 409 },
    );
  }

  if (nameConflict && nameConflict.id !== emailOwner?.id) {
    return NextResponse.json({ error: "NAME_TAKEN", message: NAME_TAKEN_MESSAGE }, { status: 409 });
  }

  if (referralId && (!referral || !["INTERESTED", "CONVERTED"].includes(referral.status))) {
    return NextResponse.json({ error: "الإحالة يجب أن تكون مهتمة ومقبولة قبل تحويلها" }, { status: 409 });
  }
  if (referralId && referral?.adminDecision !== "ACCEPTED") {
    return NextResponse.json({ error: "يجب اعتماد قرار الإحالة قبل تحويلها" }, { status: 409 });
  }
  if (referral?.convertedClientId) {
    return NextResponse.json(
      { error: "تم تحويل هذه الإحالة مسبقًا", clientId: referral.convertedClientId },
      { status: 409 },
    );
  }
  if (phoneOwner && phoneOwner.id !== emailOwner?.id && !confirmPhoneDuplicate) {
    return NextResponse.json(
      {
        error: "PHONE_MATCH_REQUIRES_CONFIRMATION",
        phoneMatch: {
          id: phoneOwner.id,
          name: phoneOwner.name,
          email: phoneOwner.email,
          role: phoneOwner.role,
        },
      },
      { status: 409 },
    );
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
              clientEnabled: true,
              isActive: emailOwner.isActive,
              ...(emailOwner.role !== "PARTNER" &&
              emailOwner.role !== "AMBASSADOR" &&
              emailOwner.role !== "ADMIN"
                ? { role: "CLIENT" as const }
                : {}),
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
              clientEnabled: true,
              isActive,
            },
          });

      if (referralId) {
        await tx.partnerReferral.update({
          where: { id: referralId },
          data: {
            status: "CONVERTED",
            adminDecision: "CONVERTED_TO_CLIENT",
            convertedClientId: savedClient.id,
            convertedAt: new Date(),
          },
        });
      }
      return savedClient;
    });

    const shouldSendInvite = sendInvite && !emailOwner;
    const invitation = shouldSendInvite
      ? await sendClientInvitation(client.id, client.email, request.nextUrl.origin)
      : { sent: false, error: undefined, invitationUrl: undefined };
    return NextResponse.json(
      {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          isActive: client.isActive,
        },
        reusedExistingClient: Boolean(emailOwner),
        inviteRequested: shouldSendInvite,
        inviteSent: invitation.sent,
        ...(invitation.error ? { inviteError: invitation.error } : {}),
        ...(invitation.invitationUrl ? { invitationUrl: invitation.invitationUrl } : {}),
      },
      { status: emailOwner ? 200 : 201 },
    );
  } catch (error) {
    console.error("[admin-clients] Failed to save client", error);
    return NextResponse.json({ error: "تعذر حفظ العميل" }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await canAdmin(request, "clients"))) {
    return NextResponse.json({ error: "لا تملك صلاحية إدارة العملاء" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) return NextResponse.json({ error: "حساب العميل مطلوب" }, { status: 400 });

  const client = await db.user.findFirst({
    where: { id: userId, OR: [{ role: "CLIENT" }, { clientEnabled: true }] },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      company: true,
      preferredLanguage: true,
      clientSource: true,
      internalNotes: true,
      isActive: true,
    },
  });
  if (!client) return NextResponse.json({ error: "حساب العميل غير موجود" }, { status: 404 });

  const isActive = typeof body?.isActive === "boolean" ? body.isActive : undefined;
  const password = typeof body?.password === "string" ? body.password : "";
  if (password && password.length < 8) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }

  const profileUpdate =
    body?.profile === true ||
    ["name", "email", "phone", "company", "preferredLanguage", "clientSource", "internalNotes"].some(
      (key) => body?.[key] !== undefined,
    );

  if (!profileUpdate && isActive === undefined && !password) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const data: {
    name?: string;
    email?: string;
    phone?: string | null;
    company?: string | null;
    preferredLanguage?: string;
    clientSource?: string | null;
    internalNotes?: string | null;
    isActive?: boolean;
    passwordHash?: string;
    clientEnabled?: boolean;
  } = {};

  if (isActive !== undefined) data.isActive = isActive;
  if (password) data.passwordHash = hashPassword(password);

  if (profileUpdate) {
    const name =
      typeof body?.name === "string" ? normalizeDisplayName(body.name) : client.name || "";
    const email =
      typeof body?.email === "string" ? normalizeEmail(body.email) : client.email;
    const phoneRaw = typeof body?.phone === "string" ? body.phone : client.phone || "";
    const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
    const company =
      typeof body?.company === "string" ? body.company.trim() : client.company || "";
    const preferredLanguage =
      body?.preferredLanguage === "en" || body?.preferredLanguage === "ar"
        ? body.preferredLanguage
        : client.preferredLanguage;
    const clientSource =
      typeof body?.clientSource === "string" ? body.clientSource.trim() : client.clientSource || "";
    const internalNotes =
      typeof body?.internalNotes === "string"
        ? body.internalNotes.trim()
        : client.internalNotes || "";

    if (name.length < 2) return NextResponse.json({ error: "الاسم مطلوب (حرفان على الأقل)" }, { status: 400 });
    if (!email.includes("@") || email.length > 254) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }
    if (phone && phone.length < 8) return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });

    const [nameConflict, emailOwner, phoneOwner] = await Promise.all([
      findNameConflict(name, client.id),
      email !== client.email
        ? db.user.findUnique({
            where: { email },
            select: { id: true, role: true, clientEnabled: true },
          })
        : null,
      phone
        ? db.user.findFirst({
            where: { phone, id: { not: client.id } },
            select: { id: true, role: true },
          })
        : null,
    ]);

    if (nameConflict) {
      return NextResponse.json({ error: "NAME_TAKEN", message: NAME_TAKEN_MESSAGE }, { status: 409 });
    }

    // Email uniqueness is global for auth identity. Changing email is allowed only when free.
    if (emailOwner && emailOwner.id !== client.id) {
      return NextResponse.json(
        { error: "البريد مستخدم لحساب آخر. لا يمكن نقل بريد مكرر لنفس نوع الحساب." },
        { status: 409 },
      );
    }

    if (phoneOwner && body?.confirmPhoneDuplicate !== true) {
      return NextResponse.json(
        {
          error: "PHONE_MATCH_REQUIRES_CONFIRMATION",
          phoneMatch: { id: phoneOwner.id, role: phoneOwner.role },
        },
        { status: 409 },
      );
    }

    data.name = name;
    data.email = email;
    data.phone = phone || null;
    data.company = company || null;
    data.preferredLanguage = preferredLanguage;
    data.clientSource = clientSource || null;
    data.internalNotes = internalNotes || null;
    data.clientEnabled = true;
  }

  const updated = await db.user.update({
    where: { id: client.id },
    data,
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
    },
  });
  return NextResponse.json({ client: updated, ok: true });
}
