"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";

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
  adminProfile: { isOwner: boolean; isActive: boolean; permissions: string[]; lastLoginAt: string | null } | null;
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/team", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "تعذر تحميل الفريق");
    else {
      setMembers(data.members || []);
      setPermissions(data.permissions || []);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selected = permissions.filter((permission) => data.get(permission) === "on");
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), identifier: data.get("identifier"), password: data.get("password"), permissions: selected }),
      });
      const result = await response.json().catch(() => null);
      setMessage(response.ok ? "تم إنشاء حساب عضو الفريق" : result?.error || "تعذر إنشاء الحساب");
      if (response.ok) {
        form.reset();
        setShowPassword(false);
        await load();
      }
    } catch {
      setMessage("تعذر الاتصال بالخادم. أعد المحاولة.");
    } finally {
      setCreating(false);
    }
  }

  async function saveMember(member: Member, form: HTMLFormElement) {
    const data = new FormData(form);
    const selected = permissions.filter((permission) => data.get(permission) === "on");
    const response = await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: member.id, isActive: data.get("isActive") === "on", permissions: selected, password: data.get("password") }),
    });
    const result = await response.json();
    setMessage(response.ok ? "تم حفظ الصلاحيات" : result.error || "تعذر حفظ الصلاحيات");
    if (response.ok) await load();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] p-4 text-[#111827] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold text-[#9A7D43]">لوحة المالك</p><h1 className="mt-1 text-3xl font-black">إدارة الفريق والصلاحيات</h1></div>
          <Link href="/admin/partners" className="rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">العودة إلى لوحة الإدارة</Link>
        </header>

        {message && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold">{message}</p>}

        <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><UserPlus className="h-6 w-6" /><h2 className="text-2xl font-black">إضافة عضو إداري</h2></div>
          <form onSubmit={createMember} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" required minLength={2} placeholder="الاسم الكامل" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <input name="identifier" required placeholder="البريد الإلكتروني أو رقم واتساب" className="rounded-xl border border-[#D8D2C4] px-4 py-3" />
            </div>
            <div className="relative max-w-xl">
              <input name="password" required minLength={8} type={showPassword ? "text" : "password"} placeholder="كلمة مرور مؤقتة — 8 أحرف على الأقل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
            <PermissionGrid permissions={permissions} selected={[]} />
            <button type="submit" disabled={creating} className="w-fit cursor-pointer rounded-xl bg-[#B89A5A] px-6 py-3 font-black text-[#111827] transition hover:bg-[#C7AA68] disabled:cursor-not-allowed disabled:opacity-60">
              {creating ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>
        </section>

        <section className="mt-7 grid gap-5">
          <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6" /><h2 className="text-2xl font-black">حسابات الإدارة</h2></div>
          {loading ? <p className="rounded-2xl bg-white p-8 text-center">جارٍ التحميل...</p> : members.length ? members.map((member) => (
            <form key={member.id} onSubmit={(event) => { event.preventDefault(); void saveMember(member, event.currentTarget); }} className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h3 className="text-xl font-black">{member.name || "دون اسم"}</h3><p className="mt-1 text-sm text-slate-500">{member.phone || member.email}</p><p className="mt-1 text-xs text-slate-400">آخر دخول: {member.adminProfile?.lastLoginAt ? new Date(member.adminProfile.lastLoginAt).toLocaleString("ar") : "لم يسجل الدخول بعد"}</p></div>
                <label className="flex items-center gap-2 font-bold"><input name="isActive" type="checkbox" defaultChecked={member.adminProfile?.isActive ?? true} /> الحساب فعال</label>
              </div>
              <div className="mt-5"><PermissionGrid permissions={permissions} selected={member.adminProfile?.permissions || []} /></div>
              <input name="password" type="password" minLength={8} placeholder="كلمة مرور جديدة — اختياري" className="mt-5 w-full max-w-xl rounded-xl border border-[#D8D2C4] px-4 py-3" />
              <button className="mt-5 rounded-xl bg-[#111827] px-5 py-3 font-black text-white">حفظ الصلاحيات</button>
            </form>
          )) : <p className="rounded-2xl bg-white p-8 text-center text-slate-500">لا توجد حسابات فريق بعد.</p>}
        </section>
      </div>
    </main>
  );
}

function PermissionGrid({ permissions, selected }: { permissions: string[]; selected: string[] }) {
  return <div><p className="mb-3 font-black">الصلاحيات</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{permissions.map((permission) => <label key={permission} className="flex items-center gap-3 rounded-xl border border-[#D8D2C4] bg-[#F7F3EB] p-3 font-bold"><input name={permission} type="checkbox" defaultChecked={selected.includes(permission)} />{labels[permission] || permission}</label>)}</div></div>;
}
