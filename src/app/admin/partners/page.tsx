"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  FolderKanban,
  Home,
  KeyRound,
  Link2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Partner = { id: string; referralNumber: number; status: "PENDING" | "ACTIVE" | "SUSPENDED"; createdAt: string; user: { name: string | null; email: string }; _count: { referrals: number } };
type ReferralStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "REJECTED";
type Referral = { id: string; name: string | null; email: string | null; phone: string | null; status: ReferralStatus; createdAt: string; partner: { user: { name: string | null; email: string } } };
type Stats = { users: number; partners: number; activePartners: number; pendingPartners: number; referrals: number; newReferrals: number; qualifiedReferrals: number; projects: number };
type Admin = { id: string; name: string | null; email: string; createdAt: string; isOwner: boolean };
type Section = "overview" | "partners" | "referrals" | "projects" | "account";

const partnerLabel: Record<Partner["status"], string> = { ACTIVE: "نشط", PENDING: "بانتظار الموافقة", SUSPENDED: "معلّق" };
const referralLabel: Record<ReferralStatus, string> = { NEW: "جديد", CONTACTED: "تم التواصل", QUALIFIED: "مؤهل", CONVERTED: "مشروع", REJECTED: "غير مناسب" };
const referralStatuses: ReferralStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"];

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

  async function changePartnerStatus(id: string, status: Partner["status"]) {
    setUpdatingId(id);
    const response = await fetch("/api/admin/partners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, entity: "partner" }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "تعذر تحديث حالة الشريك");
    else {
      setPartners((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setMessage(`تم تحديث حالة الشريك إلى ${partnerLabel[status]}`);
    }
    setUpdatingId(null);
  }

  async function changeReferralStatus(id: string, status: ReferralStatus) {
    setUpdatingId(id);
    const response = await fetch("/api/admin/partners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, entity: "referral" }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "تعذر تحديث حالة الإحالة");
    else {
      setReferrals((items) => items.map((item) => item.id === id ? { ...item, status } : item));
      setMessage(`تم تحديث الحالة إلى ${referralLabel[status]}`);
    }
    setUpdatingId(null);
  }

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "تعذر حفظ الحساب");
    setAdmin(data.admin);
    setMessage("تم حفظ بيانات حساب الإدارة بنجاح");
    const current = formElement.elements.namedItem("currentPassword") as HTMLInputElement | null;
    const next = formElement.elements.namedItem("newPassword") as HTMLInputElement | null;
    if (current) current.value = "";
    if (next) next.value = "";
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  }

  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const latestReferrals = useMemo(() => referrals.slice(0, 8), [referrals]);
  const projects = useMemo(() => referrals.filter((item) => item.status === "CONVERTED"), [referrals]);
  const nav = [
    ["overview", "نظرة عامة", BarChart3],
    ["partners", "إدارة الشركاء", UsersRound],
    ["referrals", "إدارة الإحالات", CheckCircle2],
    ["projects", "المشاريع", FolderKanban],
    ["account", "حساب المالك", UserCog],
  ] as const;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="flex flex-col bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <Link href="/" className="flex items-center gap-3 border-b border-white/10 pb-5" aria-label="العودة إلى موقع CyberWeel">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
            <div><p className="font-black">CyberWeel</p><p className="text-xs text-white/50">لوحة المالك</p></div>
          </Link>
          <nav className="mt-6 grid gap-2">
            {nav.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right font-bold transition ${section === key ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" />{label}</button>)}
            {admin?.isOwner && <Link href="/admin/team" className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-white/70 transition hover:bg-white/10 hover:text-white"><ShieldCheck className="h-5 w-5" />إدارة الفريق والصلاحيات</Link>}
            <Link href="/admin/smart-links" className="flex items-center gap-3 rounded-xl px-4 py-3 font-bold text-white/70 transition hover:bg-white/10 hover:text-white"><Link2 className="h-5 w-5" />الروابط الذكية</Link>
          </nav>
          <div className="mt-auto grid gap-2 pt-8">
            <Link href="/" className="flex items-center gap-3 rounded-xl bg-[#B89A5A] px-4 py-3 font-black text-[#111827]"><Home className="h-5 w-5" />العودة إلى الموقع</Link>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><LogOut className="h-5 w-5" />تسجيل الخروج</button>
          </div>
        </aside>

        <section className="p-4 sm:p-7 lg:p-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#9A7D43]">مركز التحكم</p><h1 className="mt-1 text-3xl font-black">مرحبًا {admin?.name || "بالمالك"}</h1></div><button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 py-3 font-bold shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />تحديث البيانات</button></header>
          {message && <p className="mt-5 rounded-xl border border-[#D8D2C4] bg-white p-4 font-bold shadow-sm">{message}</p>}
          {loading && <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">جارٍ تحميل لوحة الإدارة...</div>}

          {!loading && section === "overview" && stats && <><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
            ["إجمالي المستخدمين", stats.users], ["الشركاء النشطون", stats.activePartners], ["الإحالات الجديدة", stats.newReferrals], ["المشاريع", stats.projects],
          ].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p></article>)}</div><section className="mt-6 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-xl font-black">أحدث الإحالات</h2><div className="mt-5 grid gap-3">{latestReferrals.length ? latestReferrals.map((item) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl bg-[#F7F3EB] p-4 sm:flex-row sm:items-center"><div><p className="font-black">{item.name || "دون اسم"}</p><p className="text-sm text-slate-500">عن طريق: {item.partner.user.name || item.partner.user.email}</p></div><span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-[#9A7D43]">{referralLabel[item.status]}</span></div>) : <p className="text-slate-500">لا توجد إحالات.</p>}</div></section></>}

          {!loading && section === "partners" && <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">إدارة الشركاء</h2><span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">{partners.length} شريك</span></div><div className="mt-6 grid gap-4">{partners.map((partner) => <article key={partner.id} className="rounded-2xl border border-[#D8D2C4] p-5"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><h3 className="font-black">{partner.user.name || "دون اسم"}</h3><p className="mt-1 text-sm text-slate-500">{partner.user.email}</p><p className="mt-2 text-sm">CW-{String(partner.referralNumber).padStart(4, "0")} · {partner._count.referrals} إحالة · {partnerLabel[partner.status]}</p></div><div className="flex flex-wrap gap-2"><button disabled={updatingId === partner.id || partner.status === "ACTIVE"} onClick={() => changePartnerStatus(partner.id, "ACTIVE")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-40">تفعيل</button><button disabled={updatingId === partner.id || partner.status === "PENDING"} onClick={() => changePartnerStatus(partner.id, "PENDING")} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-white disabled:opacity-40">انتظار</button><button disabled={updatingId === partner.id || partner.status === "SUSPENDED"} onClick={() => changePartnerStatus(partner.id, "SUSPENDED")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-40">تعليق</button></div></div></article>)}</div></section>}

          {!loading && section === "referrals" && <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">إدارة الإحالات ومسار العمل</h2><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><thead><tr className="border-b"><th className="p-3">العميل</th><th className="p-3">الشريك</th><th className="p-3">التواصل</th><th className="p-3">الحالة</th><th className="p-3">التاريخ</th></tr></thead><tbody>{referrals.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3 font-bold">{item.name || "دون اسم"}</td><td className="p-3">{item.partner.user.name || item.partner.user.email}</td><td className="p-3">{item.email || item.phone || "—"}</td><td className="p-3"><select value={item.status} disabled={updatingId === item.id} onChange={(event) => changeReferralStatus(item.id, event.target.value as ReferralStatus)} className="rounded-lg border border-[#D8D2C4] bg-white px-3 py-2 font-bold">{referralStatuses.map((status) => <option key={status} value={status}>{referralLabel[status]}</option>)}</select></td><td className="p-3">{new Date(item.createdAt).toLocaleDateString("ar")}</td></tr>)}</tbody></table></div></section>}

          {!loading && section === "projects" && <section className="mt-7 rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">المشاريع</h2><p className="mt-2 text-sm text-slate-500">كل إحالة تم تحويلها إلى مشروع. يمكن إعادتها لأي مرحلة من قائمة الحالة.</p></div><span className="rounded-xl bg-[#F7F3EB] px-4 py-2 font-bold">{projects.length} مشروع</span></div><div className="mt-6 grid gap-4">{projects.length ? projects.map((item) => <article key={item.id} className="rounded-2xl border border-[#D8D2C4] p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="font-black">{item.name || "مشروع دون اسم"}</h3><p className="mt-1 text-sm text-slate-500">الشريك: {item.partner.user.name || item.partner.user.email}</p><p className="mt-1 text-sm text-slate-500">{item.email || item.phone || "لا توجد وسيلة تواصل"}</p></div><select value={item.status} onChange={(event) => changeReferralStatus(item.id, event.target.value as ReferralStatus)} className="rounded-xl border border-[#D8D2C4] px-4 py-3 font-bold">{referralStatuses.map((status) => <option key={status} value={status}>{referralLabel[status]}</option>)}</select></div></article>) : <p className="rounded-xl bg-[#F7F3EB] p-5 text-slate-500">لا توجد مشاريع محوّلة بعد.</p>}</div></section>}

          {!loading && section === "account" && <section className="mt-7 max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#111827] text-white"><ShieldCheck className="h-6 w-6" /></span><div><h2 className="text-2xl font-black">حساب المالك</h2><p className="text-sm text-slate-500">تعديل الاسم والبريد وكلمة المرور</p></div></div><form onSubmit={saveAccount} className="mt-7 grid gap-4"><label className="grid gap-2 font-bold">الاسم<input name="name" defaultValue={admin?.name || ""} className="rounded-xl border border-[#D8D2C4] px-4 py-3" /></label><label className="grid gap-2 font-bold">البريد الإلكتروني<input name="email" type="email" defaultValue={admin?.email || ""} required className="rounded-xl border border-[#D8D2C4] px-4 py-3" /></label><div className="mt-3 flex items-center gap-2 font-black"><KeyRound className="h-5 w-5" />تغيير كلمة المرور</div><PasswordField name="currentPassword" label="كلمة المرور الحالية" visible={showCurrentPassword} toggle={() => setShowCurrentPassword((value) => !value)} /><PasswordField name="newPassword" label="كلمة المرور الجديدة" visible={showNewPassword} toggle={() => setShowNewPassword((value) => !value)} minLength={8} /><button className="mt-2 rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white">حفظ التعديلات</button></form></section>}
        </section>
      </div>
    </main>
  );
}

function PasswordField({ name, label, visible, toggle, minLength }: { name: string; label: string; visible: boolean; toggle: () => void; minLength?: number }) {
  return <label className="grid gap-2 font-bold">{label}<div className="relative"><input name={name} type={visible ? "text" : "password"} minLength={minLength} className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12" /><button type="button" onClick={toggle} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={visible ? `إخفاء ${label}` : `إظهار ${label}`}>{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>;
}
