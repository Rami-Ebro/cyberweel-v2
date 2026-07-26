"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, Eye, EyeOff, KeyRound, LogOut, RefreshCw, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Partner = { id: string; referralNumber: number; status: "PENDING" | "ACTIVE" | "SUSPENDED"; createdAt: string; user: { name: string | null; email: string }; _count: { referrals: number } };
type Referral = { id: string; name: string | null; email: string | null; phone: string | null; status: string; createdAt: string; partner: { user: { name: string | null; email: string } } };
type Stats = { users: number; partners: number; activePartners: number; pendingPartners: number; referrals: number; newReferrals: number };
type Admin = { id: string; name: string | null; email: string; createdAt: string };
type Section = "overview" | "partners" | "referrals" | "account";

const statusLabel: Record<Partner["status"], string> = { ACTIVE: "نشط", PENDING: "بانتظار الموافقة", SUSPENDED: "معلّق" };
const referralLabel: Record<string, string> = { NEW: "جديد", CONTACTED: "تم التواصل", QUALIFIED: "مؤهل", CONVERTED: "تحوّل إلى مشروع", REJECTED: "غير مناسب" };

export default function AdminPartnersPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function load() {
    setLoading(true);
    setMessage("");
    const [dashboardResponse, accountResponse] = await Promise.all([
      fetch("/api/admin/partners", { cache: "no-store" }),
      fetch("/api/admin/account", { cache: "no-store" }),
    ]);

    if (dashboardResponse.status === 401 || accountResponse.status === 401) {
      router.replace("/login");
      return;
    }

    const dashboard = await dashboardResponse.json();
    const account = await accountResponse.json();
    if (!dashboardResponse.ok) setMessage(dashboard.error || "تعذر تحميل لوحة الإدارة");
    else {
      setPartners(dashboard.partners || []);
      setReferrals(dashboard.referrals || []);
      setStats(dashboard.stats || null);
    }
    if (accountResponse.ok) setAdmin(account.admin);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function changeStatus(id: string, status: Partner["status"]) {
    setUpdatingId(id);
    const response = await fetch("/api/admin/partners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "تعذر تحديث حالة الشريك");
    else {
      setPartners((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setMessage(`تم تحديث حالة الشريك إلى ${statusLabel[status]}`);
    }
    setUpdatingId(null);
  }

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "تعذر حفظ الحساب");
    setAdmin(data.admin);
    setMessage("تم حفظ بيانات حساب الإدارة");
    event.currentTarget.reset();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  }

  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const latestReferrals = useMemo(() => referrals.slice(0, 8), [referrals]);
  const nav = [
    ["overview", "نظرة عامة", BarChart3],
    ["partners", "إدارة الشركاء", UsersRound],
    ["referrals", "الإحالات", CheckCircle2],
    ["account", "حساب الإدارة", UserCog],
  ] as const;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span><div><p className="font-black">CyberWeel</p><p className="text-xs text-white/50">لوحة الإدارة</p></div></div>
          <nav className="mt-6 grid gap-2">{nav.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${section === key ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{label}</button>)}</nav>
          <button onClick={logout} className="mt-8 flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><LogOut className="h-5 w-5" />تسجيل الخروج</button>
        </aside>

        <section className="p-4 sm:p-7 lg:p-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#9A7D43]">إدارة المنصة</p><h1 className="mt-1 text-3xl font-black">مرحبًا {admin?.name || "بالإدارة"}</h1></div><button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث البيانات</button></header>

          {message && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{message}</p>}
          {loading ? <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">جارٍ تحميل لوحة الإدارة...</div> : null}

          {!loading && section === "overview" && stats && <><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
            ["إجمالي المستخدمين", stats.users], ["الشركاء", stats.partners], ["الشركاء النشطون", stats.activePartners], ["طلبات الشراكة", stats.pendingPartners], ["الإحالات", stats.referrals], ["الإحالات الجديدة", stats.newReferrals],
          ].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p></article>)}</div><section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-xl font-black">أحدث الإحالات</h2><div className="mt-5 grid gap-3">{latestReferrals.length ? latestReferrals.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl bg-[#F7F3EB] p-4 sm:flex-row sm:items-center"><div><p className="font-black">{item.name || "دون اسم"}</p><p className="text-sm text-slate-500">عن طريق: {item.partner.user.name || item.partner.user.email}</p></div><span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-[#9A7D43]">{referralLabel[item.status] || item.status}</span></div>) : <p className="text-slate-500">لا توجد إحالات.</p>}</div></section></>}

          {!loading && section === "partners" && <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">إدارة الشركاء</h2><span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">{partners.length} شريك</span></div><div className="mt-6 grid gap-4">{partners.map((partner) => <article key={partner.id} className="rounded-2xl border border-[#D8D2C4] p-5"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="flex flex-wrap items-center gap-3"><h3 className="font-black">{partner.user.name || "دون اسم"}</h3><span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-black text-[#9A7D43]">{statusLabel[partner.status]}</span></div><p className="mt-1 text-sm text-slate-500">{partner.user.email}</p><p className="mt-2 text-sm">CW-{String(partner.referralNumber).padStart(4, "0")} · {partner._count.referrals} إحالة</p></div><div className="flex flex-wrap gap-2"><button disabled={updatingId === partner.id || partner.status === "ACTIVE"} onClick={() => changeStatus(partner.id, "ACTIVE")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-40">تفعيل</button><button disabled={updatingId === partner.id || partner.status === "PENDING"} onClick={() => changeStatus(partner.id, "PENDING")} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-white disabled:opacity-40">انتظار</button><button disabled={updatingId === partner.id || partner.status === "SUSPENDED"} onClick={() => changeStatus(partner.id, "SUSPENDED")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-40">تعليق</button></div></div></article>)}</div></section>}

          {!loading && section === "referrals" && <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">كل الإحالات</h2><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm"><thead><tr className="border-b"><th className="p-3">العميل</th><th className="p-3">الشريك</th><th className="p-3">التواصل</th><th className="p-3">الحالة</th><th className="p-3">التاريخ</th></tr></thead><tbody>{referrals.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3 font-bold">{item.name || "دون اسم"}</td><td className="p-3">{item.partner.user.name || item.partner.user.email}</td><td className="p-3">{item.email || item.phone || "—"}</td><td className="p-3">{referralLabel[item.status] || item.status}</td><td className="p-3">{new Date(item.createdAt).toLocaleDateString("ar")}</td></tr>)}</tbody></table></div></section>}

          {!loading && section === "account" && <section className="mt-7 max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#111827] text-white"><ShieldCheck className="h-6 w-6" /></span><div><h2 className="text-2xl font-black">حساب الإدارة</h2><p className="text-sm text-slate-500">تعديل الاسم والبريد وكلمة المرور</p></div></div><form onSubmit={saveAccount} className="mt-7 grid gap-4"><label className="grid gap-2 font-bold">الاسم<input name="name" defaultValue={admin?.name || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3" /></label><label className="grid gap-2 font-bold">البريد الإلكتروني<input name="email" type="email" defaultValue={admin?.email || ""} required className="rounded-xl border border-[#D8D2C4] px-4 py-3" /></label><div className="mt-3 flex items-center gap-2 font-black"><KeyRound className="h-5 w-5" />تغيير كلمة المرور</div><label className="grid gap-2 font-bold">كلمة المرور الحالية<div className="relative"><input name="currentPassword" type={showCurrentPassword ? "text" : "password"} className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" /><button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showCurrentPassword ? "إخفاء كلمة المرور الحالية" : "إظهار كلمة المرور الحالية"}>{showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label><label className="grid gap-2 font-bold">كلمة المرور الجديدة<div className="relative"><input name="newPassword" type={showNewPassword ? "text" : "password"} minLength={8} className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" /><button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showNewPassword ? "إخفاء كلمة المرور الجديدة" : "إظهار كلمة المرور الجديدة"}>{showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label><button className="mt-2 rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white">حفظ التعديلات</button></form></section>}
        </section>
      </div>
    </main>
  );
}
