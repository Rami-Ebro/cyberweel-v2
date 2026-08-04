"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, PauseCircle, PlayCircle, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDateTime } from "@/lib/date-format";

const labels: Record<string, string> = {
  overview: "عرض النظرة العامة",
  partners: "إدارة الشركاء",
  referrals: "إدارة الإحالات",
  projects: "إدارة المشاريع",
  clients: "إدارة العملاء",
  files: "إدارة الملفات والتسليمات",
  invoices: "إدارة الفواتير والدفعات",
  messages: "إدارة الرسائل",
  smart_links: "إدارة الروابط الذكية",
  team: "إدارة فريق الإدارة",
  settings: "إدارة الإعدادات",
};

type Member = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  adminProfile: { isOwner: boolean; isActive: boolean; permissions: string[]; lastLoginAt: string | null } | null;
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [message, setMessage] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [visibleMemberPasswords, setVisibleMemberPasswords] = useState<string[]>([]);
  const [updatingMemberId, setUpdatingMemberId] = useState("");
  const [expandedMemberIds, setExpandedMemberIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  async function load(clearMessage = true) {
    setLoading(true);
    if (clearMessage) setMessage("");
    const response = await fetch("/api/admin/team", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "تعذر تحميل الفريق");
    else {
      setMembers(data.members || []);
      setPermissions(data.permissions || []);
      setCurrentUserId(data.currentUserId || "");
    }
    setLoading(false);
  }

  useEffect(() => { void Promise.resolve().then(() => load()); }, []);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selected = permissions.filter((permission) => data.get(permission) === "on");
    setCreating(true);
    setMessage("");
    setCreateMessage("");
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), identifier: data.get("identifier"), password: data.get("password"), permissions: selected }),
      });
      const result = await response.json().catch(() => null);
      const resultMessage = response.ok ? "تم إنشاء حساب عضو الفريق بنجاح" : result?.error || "تعذر إنشاء الحساب";
      setMessage(resultMessage);
      setCreateMessage(resultMessage);
      if (response.ok) {
        form.reset();
        setShowPassword(false);
        setCreateOpen(false);
        await load(false);
      }
    } catch {
      const resultMessage = "تعذر الاتصال بالخادم. أعد المحاولة.";
      setMessage(resultMessage);
      setCreateMessage(resultMessage);
    } finally {
      setCreating(false);
    }
  }

  async function saveMember(member: Member, form: HTMLFormElement) {
    const data = new FormData(form);
    const selected = permissions.filter((permission) => data.get(permission) === "on");
    setUpdatingMemberId(member.id);
    try {
      const response = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, isActive: member.adminProfile?.isActive ?? true, permissions: selected, password: data.get("password") }),
      });
      const result = await response.json();
      setMessage(response.ok ? "تم حفظ الصلاحيات وكلمة المرور" : result.error || "تعذر حفظ الصلاحيات");
      if (response.ok) {
        const passwordInput = form.elements.namedItem("password") as HTMLInputElement | null;
        if (passwordInput) passwordInput.value = "";
        setVisibleMemberPasswords((items) => items.filter((id) => id !== member.id));
        await load(false);
      }
    } finally {
      setUpdatingMemberId("");
    }
  }

  async function toggleMember(member: Member) {
    setUpdatingMemberId(member.id);
    const nextActive = !(member.adminProfile?.isActive ?? true);
    try {
      const response = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, isActive: nextActive }),
      });
      const result = await response.json();
      setMessage(response.ok ? (nextActive ? "تم تفعيل الحساب" : "تم تعليق الحساب") : result.error || "تعذر تحديث الحساب");
      if (response.ok) await load(false);
    } finally {
      setUpdatingMemberId("");
    }
  }

  async function deleteMember(member: Member) {
    if (!window.confirm(`حذف حساب ${member.name || member.email} نهائيًا؟ لا يمكن التراجع عن ذلك.`)) return;
    setUpdatingMemberId(member.id);
    try {
      const response = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });
      const result = await response.json();
      setMessage(response.ok ? "تم حذف حساب الإدارة" : result.error || "تعذر حذف الحساب");
      if (response.ok) await load(false);
    } finally {
      setUpdatingMemberId("");
    }
  }

  const permissionCount = (member: Member) => member.adminProfile?.isOwner
    ? permissions.length
    : new Set(member.adminProfile?.permissions || []).size;

  const sortedMembers = [...members].sort((first, second) => {
    const ownerDifference = Number(Boolean(second.adminProfile?.isOwner)) - Number(Boolean(first.adminProfile?.isOwner));
    if (ownerDifference) return ownerDifference;
    const permissionDifference = permissionCount(second) - permissionCount(first);
    if (permissionDifference) return permissionDifference;
    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  });

  function toggleMemberOpen(memberId: string) {
    setExpandedMemberIds((items) => items.includes(memberId) ? items.filter((id) => id !== memberId) : [...items, memberId]);
  }

  return (
    <AdminShell active="team" eyebrow="لوحة المالك" title="إدارة الفريق والصلاحيات" description="إدارة حسابات فريق الإدارة وتحديد نطاق وصول كل عضو." wide={false}>

        {message && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold">{message}</p>}

        <section className="mt-7 grid gap-5">
          <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6" /><h2 className="text-2xl font-black">حسابات الإدارة</h2></div>
          {loading ? <p className="rounded-2xl bg-white p-8 text-center">جارٍ التحميل...</p> : sortedMembers.length ? sortedMembers.map((member) => {
            const isExpanded = expandedMemberIds.includes(member.id);
            const count = permissionCount(member);
            const isProtected = Boolean(member.adminProfile?.isOwner) || member.id === currentUserId;

            return (
              <article key={member.id} className="overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
                <button type="button" aria-expanded={isExpanded} onClick={() => toggleMemberOpen(member.id)} className="flex w-full items-center justify-between gap-4 p-5 text-right transition hover:bg-[#FBF8F2]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black">{member.name || "دون اسم"}</h3>
                      {member.id === currentUserId && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">حسابك الحالي</span>}
                      {member.adminProfile?.isOwner && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">المالك الرئيسي</span>}
                      {!member.adminProfile && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">حساب إدارة قديم</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500">{member.phone || member.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${(member.adminProfile?.isActive ?? true) ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {(member.adminProfile?.isActive ?? true) ? "الحساب فعال" : "الحساب معلّق"}
                      </span>
                      <span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-black text-[#7A6335]">
                        {member.adminProfile?.isOwner ? "كامل الصلاحيات" : `${count} من ${permissions.length} صلاحيات`}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`h-6 w-6 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <form onSubmit={(event) => { event.preventDefault(); void saveMember(member, event.currentTarget); }} className="border-t border-[#E8E1D5] p-6">
                    <div className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2">
                      <p>أُنشئ: {formatDateTime(member.createdAt)}</p>
                      <p>آخر دخول: {member.adminProfile?.lastLoginAt ? formatDateTime(member.adminProfile.lastLoginAt) : "لم يسجل الدخول بعد"}</p>
                    </div>
                    <div className="mt-5">
                      <PermissionGrid permissions={permissions} selected={member.adminProfile?.isOwner ? permissions : member.adminProfile?.permissions || []} disabled={isProtected} />
                    </div>
                    {member.adminProfile?.isOwner && <p className="mt-5 rounded-xl bg-amber-50 p-4 font-bold text-amber-900">حساب المالك الرئيسي محمي ويملك كامل الصلاحيات.</p>}
                    {!member.adminProfile?.isOwner && member.id === currentUserId && <p className="mt-5 rounded-xl bg-[#F7F3EB] p-4 font-bold text-slate-600">لا يمكن تعديل صلاحيات الحساب الحالي أو تعليقه من جلسته.</p>}
                    {!member.adminProfile?.isOwner && member.id !== currentUserId && <>
                      <div className="relative mt-5 w-full max-w-xl">
                        <input name="password" type={visibleMemberPasswords.includes(member.id) ? "text" : "password"} minLength={8} placeholder="كلمة مرور جديدة — اختياري" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
                        <button type="button" onClick={() => setVisibleMemberPasswords((items) => items.includes(member.id) ? items.filter((id) => id !== member.id) : [...items, member.id])} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label="إظهار أو إخفاء كلمة المرور">
                          {visibleMemberPasswords.includes(member.id) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button disabled={updatingMemberId === member.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50">{updatingMemberId === member.id ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
                        <button type="button" disabled={updatingMemberId === member.id} onClick={() => void toggleMember(member)} className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-black text-amber-800 disabled:opacity-50">
                          {(member.adminProfile?.isActive ?? true) ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                          {(member.adminProfile?.isActive ?? true) ? "تعليق الحساب" : "تفعيل الحساب"}
                        </button>
                        <button type="button" disabled={updatingMemberId === member.id} onClick={() => void deleteMember(member)} className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 py-3 font-black text-red-700 disabled:opacity-50"><Trash2 className="h-5 w-5" />حذف الحساب</button>
                      </div>
                    </>}
                  </form>
                )}
              </article>
            );
          }) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">لا توجد حسابات فريق بعد.</p>}
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white shadow-sm">
          <button type="button" aria-expanded={createOpen} onClick={() => setCreateOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 p-5 text-right transition hover:bg-[#FBF8F2]">
            <div className="flex items-center gap-3"><UserPlus className="h-6 w-6" /><div><h2 className="text-2xl font-black">إضافة عضو إداري جديد</h2><p className="mt-1 text-sm text-slate-500">إنشاء حساب جديد وتحديد صلاحياته</p></div></div>
            <ChevronDown className={`h-6 w-6 shrink-0 transition-transform ${createOpen ? "rotate-180" : ""}`} />
          </button>
          {createOpen && (
            <form onSubmit={createMember} className="grid gap-4 border-t border-[#E8E1D5] p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" required minLength={2} placeholder="الاسم الكامل" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
                <input name="identifier" required placeholder="البريد الإلكتروني أو رقم واتساب" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              </div>
              <div className="relative max-w-xl">
                <input name="password" required minLength={8} type={showPassword ? "text" : "password"} placeholder="كلمة مرور مؤقتة — 8 أحرف على الأقل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              <PermissionGrid permissions={permissions} selected={[]} />
              <button type="submit" disabled={creating} className="w-fit cursor-pointer rounded-xl bg-[#B89A5A] px-6 py-3 font-black text-[#111827] transition hover:bg-[#C7AA68] disabled:cursor-wait disabled:opacity-60">
                {creating ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
              </button>
              {createMessage && <p role="status" className="w-fit rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] px-4 py-3 font-bold">{createMessage}</p>}
            </form>
          )}
        </section>
    </AdminShell>
  );
}

function PermissionGrid({ permissions, selected, disabled = false }: { permissions: string[]; selected: string[]; disabled?: boolean }) {
  return <div><p className="mb-3 font-black">الصلاحيات</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{permissions.map((permission) => <label key={permission} className={`flex items-center gap-3 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] p-3 font-bold ${disabled ? "cursor-not-allowed opacity-70" : ""}`}><input name={permission} type="checkbox" defaultChecked={selected.includes(permission)} disabled={disabled} />{labels[permission] || permission}</label>)}</div></div>;
}
