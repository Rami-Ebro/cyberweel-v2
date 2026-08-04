"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Check,
  CircleDollarSign,
  Copy,
  Filter,
  Home,
  Link2,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Sun,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/date-format";

type SectionKey = "overview" | "referrals" | "commissions" | "profile";
type CommissionStatus = "VERIFYING" | "ON_HOLD" | "NOT_ELIGIBLE" | "DUE" | "PAID";
type Referral = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  contactMethod: string | null;
  notes: string | null;
  commissionAmount: string | null;
  commissionCurrency: string;
  commissionStatus: CommissionStatus;
  createdAt: string;
};
type CommissionSummary = {
  currency: string;
  pending: string;
  approved: string;
  paid: string;
  cancelled: string;
};
type DashboardData = {
  isAdminPreview: boolean;
  ambassador: {
    name: string;
    email: string;
    code: string;
    referralUrl: string;
    joinedAt: string;
    phone: string | null;
    country: string | null;
    contactMethod: string | null;
    payoutMethod: string | null;
    payoutDetails: string | null;
  };
  stats: {
    referrals: number;
    converted: number;
    qualified: number;
    commissionsByCurrency: CommissionSummary[];
  };
  referrals: Referral[];
};

const navigation: { key: SectionKey; label: string; icon: typeof Home }[] = [
  { key: "overview", label: "نظرة عامة", icon: Home },
  { key: "referrals", label: "إحالاتي", icon: UsersRound },
  { key: "commissions", label: "العمولات", icon: BadgeDollarSign },
  { key: "profile", label: "الملف وبيانات الاستلام", icon: UserRound },
];

const referralStatus: Record<string, string> = {
  NEW: "جديدة",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم",
  AWAITING_RESPONSE: "بانتظار الرد",
  NOT_INTERESTED: "غير مهتم",
  CONVERTED: "تحولت إلى عميل",
};

const referralStatusClass: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  CONTACTED: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  INTERESTED: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  AWAITING_RESPONSE: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  NOT_INTERESTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  CONVERTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
};

const commissionStatus: Record<CommissionStatus, string> = {
  VERIFYING: "قيد التحقق",
  ON_HOLD: "معلّقة",
  NOT_ELIGIBLE: "غير مستحقة",
  DUE: "مستحقة",
  PAID: "مدفوعة",
};

const commissionStatusClass: Record<CommissionStatus, string> = {
  VERIFYING: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  ON_HOLD: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  NOT_ELIGIBLE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  DUE: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
};

function money(amount: string | number, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("ar", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function DashboardWordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm"><Logo size={42} /></span>
      <span className="flex flex-col">
        <span aria-label="CyberWeel" className="block h-[34px] w-[128px] bg-white" style={{ WebkitMaskImage: "url('/cyberweel-wordmark.svg')", maskImage: "url('/cyberweel-wordmark.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />
        <span className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-white/45">بوابة السفراء</span>
      </span>
    </span>
  );
}

export default function AmbassadorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingReferral, setAddingReferral] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadDashboard() {
    const previewId = new URLSearchParams(window.location.search).get("adminPreview");
    const endpoint = previewId
      ? `/api/ambassador/dashboard?adminPreview=${encodeURIComponent(previewId)}`
      : "/api/ambassador/dashboard";
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      if (payload.redirectTo) {
        router.replace(payload.redirectTo);
        return;
      }
      throw new Error(payload.error === "PROFILE_REQUIRED" ? "أكمل ملفك أولًا" : "تعذر تحميل لوحة السفير");
    }
    setData(payload);
  }

  useEffect(() => {
    setDarkMode(localStorage.getItem("cyberweel-ambassador-theme") === "dark");
    loadDashboard().catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل البيانات"));
  }, []);

  const filteredReferrals = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.referrals.filter((referral) => {
      const matchesStatus = statusFilter === "ALL" || referral.status === statusFilter;
      const haystack = [referral.name, referral.email, referral.phone].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [data, search, statusFilter]);

  function navigate(section: SectionKey) {
    setActiveSection(section);
    setMenuOpen(false);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDarkMode() {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("cyberweel-ambassador-theme", next ? "dark" : "light");
      return next;
    });
  }

  async function copyReferralLink() {
    if (!data) return;
    await navigator.clipboard.writeText(data.ambassador.referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function addReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data?.isAdminPreview) {
      setError("المعاينة الإدارية للقراءة فقط.");
      return;
    }
    setAddingReferral(true);
    setError("");
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/ambassador/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر إضافة الإحالة");
      setData((current) => current ? {
        ...current,
        referrals: [payload.referral, ...current.referrals],
        stats: { ...current.stats, referrals: current.stats.referrals + 1 },
      } : current);
      formElement.reset();
      setNotice("تم تسجيل الإحالة وربطها بحسابك. الإدارة ستتابع حالتها من هنا.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إضافة الإحالة");
    } finally {
      setAddingReferral(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data?.isAdminPreview) {
      setError("المعاينة الإدارية للقراءة فقط.");
      return;
    }
    setSavingProfile(true);
    setError("");
    setNotice("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error === "REQUIRED_FIELDS" ? "أكمل جميع بيانات الملف والاستلام" : "تعذر حفظ الملف");
      setData((current) => current ? {
        ...current,
        ambassador: {
          ...current.ambassador,
          phone: String(form.phone || ""),
          country: String(form.country || ""),
          contactMethod: String(form.contactMethod || ""),
          payoutMethod: String(form.payoutMethod || ""),
          payoutDetails: String(form.payoutDetails || ""),
        },
      } : current);
      setNotice("تم حفظ بيانات التواصل واستلام العمولات.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ الملف");
    } finally {
      setSavingProfile(false);
    }
  }

  async function logout() {
    if (data?.isAdminPreview) {
      router.push("/admin/ambassadors");
      return;
    }
    setLoggingOut(true);
    try {
      await fetch("/api/partner/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (error && !data) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f5f1e8] p-6"><div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-slate-950">تعذر تحميل لوحة السفير</h1><p className="mt-3 text-slate-600">{error}</p><button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">المحاولة مجددًا</button></div></main>;
  }
  if (!data) return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f5f1e8]"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#bd9850] border-t-transparent" /></main>;

  const approvedLabel = data.stats.commissionsByCurrency.length ? data.stats.commissionsByCurrency.map((item) => money(item.approved, item.currency)).join(" · ") : "—";
  const paidLabel = data.stats.commissionsByCurrency.length ? data.stats.commissionsByCurrency.map((item) => money(item.paid, item.currency)).join(" · ") : "—";

  return (
    <div dir="rtl" className={darkMode ? "dark min-h-screen bg-slate-950 text-white" : "min-h-screen bg-[#f5f1e8] text-slate-950"}>
      {menuOpen && <button aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden" />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-[310px] flex-col bg-[#101827] p-6 text-white shadow-2xl transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between gap-3"><DashboardWordmark /><button aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"><X size={22} /></button></div>
        <nav className="mt-12 space-y-2">{navigation.map((item) => { const Icon = item.icon; const active = activeSection === item.key; return <button key={item.key} type="button" onClick={() => navigate(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-right font-black transition ${active ? "bg-[#bd9850] text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon size={20} />{item.label}</button>; })}</nav>
        <div className="mt-auto space-y-3"><Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-[#bd9850] px-4 py-3 font-black text-slate-950"><ArrowLeft size={18} />العودة إلى الموقع</Link><div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/65">تحتاج إلى مساعدة؟<br /><Link href="/contact" className="font-black text-[#d5b873]">تواصل معنا</Link></div></div>
      </aside>

      <main className="min-h-screen lg:mr-[310px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f1e8]/90 px-4 py-4 backdrop-blur sm:px-7 lg:px-10 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div className="flex items-center gap-3"><button aria-label="فتح القائمة" onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-900"><Menu size={21} /></button><div><p className="text-xs font-black tracking-[0.14em] text-[#9f7d3d]">{data.isAdminPreview ? "معاينة الإدارة · للقراءة فقط" : "لوحة سفير CyberWeel"}</p><h1 className="mt-1 text-lg font-black sm:text-2xl">مرحبًا، {data.ambassador.name}</h1></div></div><div className="flex items-center gap-2"><button aria-label="تبديل المظهر" onClick={toggleDarkMode} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button><button type="button" onClick={logout} disabled={loggingOut} className="hidden items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-black text-white hover:bg-rose-700 disabled:opacity-60 sm:flex"><LogOut size={18} />{data.isAdminPreview ? "العودة للإدارة" : loggingOut ? "جارٍ الخروج" : "تسجيل الخروج"}</button></div></div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-7 lg:p-10">
          {(error || notice) && <div className={`rounded-2xl border px-5 py-4 text-sm font-bold ${error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}>{error || notice}</div>}

          {activeSection === "overview" && <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
              { label: "إجمالي الإحالات", value: data.stats.referrals, icon: UsersRound },
              { label: "تحولت إلى مشاريع", value: data.stats.converted, icon: Check },
              { label: "عمولات معتمدة", value: approvedLabel, icon: BadgeDollarSign },
              { label: "عمولات مدفوعة", value: paidLabel, icon: WalletCards },
            ].map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500 dark:text-slate-400">{card.label}</p><strong className="mt-3 block text-2xl font-black text-slate-950 dark:text-white">{card.value}</strong></div><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15 dark:text-[#d5b873]"><Icon size={22} /></span></div></div>; })}</section>

            <section className="rounded-3xl bg-[#101827] p-6 text-white shadow-xl sm:p-8"><div className="flex flex-col gap-6"><div><p className="text-sm font-black text-[#d5b873]">رابطك الموثق</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">شارك الفرصة وتابع النتيجة بشفافية</h2><p className="mt-3 max-w-3xl leading-8 text-white/65">العمولة لا تُسجل على الوعد، بل على إحالة موثقة ونتيجة فعلية تعتمدها الإدارة.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm text-white/55">رمز الإحالة</span><strong className="text-[#d5b873]">{data.ambassador.code}</strong></div><div className="flex flex-col gap-3 sm:flex-row"><input readOnly dir="ltr" value={data.ambassador.referralUrl} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left font-mono text-sm text-white outline-none" /><button type="button" onClick={copyReferralLink} className="flex items-center justify-center gap-2 rounded-xl bg-[#bd9850] px-5 py-3 font-black text-slate-950">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "تم النسخ" : "نسخ الرابط"}</button></div></div></div></section>

            <section><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-black text-[#9f7d3d]">آخر النشاط</p><h2 className="mt-1 text-2xl font-black">أحدث الإحالات</h2></div><button onClick={() => navigate("referrals")} className="font-black text-[#9f7d3d]">عرض الكل</button></div><div className="grid gap-3">{data.referrals.length ? data.referrals.slice(0, 5).map((referral) => <article key={referral.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900"><div><h3 className="font-black">{referral.name || "إحالة دون اسم"}</h3><p className="mt-1 text-sm text-slate-500">{referral.email || referral.phone || "لا توجد وسيلة تواصل"} · {formatDate(referral.createdAt)}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${referralStatusClass[referral.status] || referralStatusClass.NEW}`}>{referralStatus[referral.status] || referral.status}</span></article>) : <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">لا توجد إحالات بعد. ابدأ بالرابط أو أضف إحالة مباشرة.</div>}</div></section>
          </>}

          {activeSection === "referrals" && <section className="space-y-7"><div><p className="text-sm font-black text-[#9f7d3d]">مسارك الخاص</p><h2 className="mt-1 text-3xl font-black">إحالاتي</h2><p className="mt-2 text-slate-600 dark:text-slate-300">ترى إحالاتك فقط؛ قرارات الحالة والعمولة تبقى بيد الإدارة.</p></div>
            <form onSubmit={addReferral} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15"><PlusCircle size={23} /></span><div><h3 className="text-xl font-black">إضافة إحالة مباشرة</h3><p className="text-sm text-slate-500">استخدمها عندما يصل العميل إليك مباشرة بدل الرابط.</p></div></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">اسم العميل<input required name="name" maxLength={120} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">طريقة التواصل المفضلة<input name="contactMethod" maxLength={80} placeholder="واتساب، اتصال، بريد..." className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<input name="email" type="email" maxLength={254} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">رقم الهاتف<input name="phone" maxLength={40} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">ما الذي يحتاجه العميل؟<textarea required name="notes" maxLength={2000} rows={4} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label></div><button disabled={addingReferral} className="mt-5 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60 dark:bg-[#bd9850] dark:text-slate-950">{addingReferral ? "جارٍ التسجيل..." : "تسجيل الإحالة"}</button><p className="mt-3 text-xs text-slate-500">يجب إدخال البريد أو رقم الهاتف على الأقل.</p></form>

            <div className="flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو وسيلة التواصل" className="w-full bg-transparent outline-none" /></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><Filter size={18} className="text-slate-400" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-transparent font-bold outline-none"><option value="ALL">كل الحالات</option>{Object.entries(referralStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right"><thead className="bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-5 py-4">العميل</th><th className="px-5 py-4">التواصل</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">العمولة</th><th className="px-5 py-4">التاريخ</th></tr></thead><tbody>{filteredReferrals.map((referral) => <tr key={referral.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-black">{referral.name || "دون اسم"}</td><td className="px-5 py-4 text-sm text-slate-500"><div>{referral.email || referral.phone || "—"}</div>{referral.contactMethod && <div className="mt-1 text-xs">{referral.contactMethod}</div>}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${referralStatusClass[referral.status] || referralStatusClass.NEW}`}>{referralStatus[referral.status] || referral.status}</span></td><td className="px-5 py-4 text-sm">{referral.commissionAmount ? money(referral.commissionAmount, referral.commissionCurrency) : "لم تُحدد"}</td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(referral.createdAt)}</td></tr>)}</tbody></table>{!filteredReferrals.length && <div className="p-10 text-center text-slate-500">لا توجد نتائج مطابقة.</div>}</div></div>
          </section>}

          {activeSection === "commissions" && <section className="space-y-7"><div><p className="text-sm font-black text-[#9f7d3d]">أرقام موثقة بلا وعود ضبابية</p><h2 className="mt-1 text-3xl font-black">العمولات</h2><p className="mt-2 text-slate-600 dark:text-slate-300">كل عمولة مرتبطة بإحالة وحالة اعتماد واضحة، مع فصل العملات منعًا لجمع التفاح بالدولار مع البرتقال باليورو.</p></div>
            <div className="grid gap-4 lg:grid-cols-2">{data.stats.commissionsByCurrency.map((summary) => <article key={summary.currency} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-slate-500">العملة</p><h3 className="mt-1 text-2xl font-black">{summary.currency}</h3></div><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15"><CircleDollarSign size={24} /></span></div><div className="mt-6 grid grid-cols-3 gap-3"><div><span className="text-xs text-slate-500">قيد التحقق</span><strong className="mt-1 block">{money(summary.pending, summary.currency)}</strong></div><div><span className="text-xs text-slate-500">معتمدة</span><strong className="mt-1 block">{money(summary.approved, summary.currency)}</strong></div><div><span className="text-xs text-slate-500">مدفوعة</span><strong className="mt-1 block">{money(summary.paid, summary.currency)}</strong></div></div></article>)}</div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-right"><thead className="bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-5 py-4">الإحالة</th><th className="px-5 py-4">المبلغ</th><th className="px-5 py-4">حالة العمولة</th><th className="px-5 py-4">حالة الإحالة</th><th className="px-5 py-4">التاريخ</th></tr></thead><tbody>{data.referrals.map((referral) => <tr key={referral.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-black">{referral.name || referral.email || referral.phone || "إحالة"}</td><td className="px-5 py-4 font-bold">{referral.commissionAmount ? money(referral.commissionAmount, referral.commissionCurrency) : "لم تُحدد"}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${commissionStatusClass[referral.commissionStatus]}`}>{commissionStatus[referral.commissionStatus]}</span></td><td className="px-5 py-4 text-sm">{referralStatus[referral.status] || referral.status}</td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(referral.createdAt)}</td></tr>)}</tbody></table></div></div>
          </section>}

          {activeSection === "profile" && <section className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-black text-[#9f7d3d]">بياناتك المالية والتواصلية</p><h2 className="mt-1 text-3xl font-black">الملف وبيانات الاستلام</h2><p className="mt-2 text-slate-600 dark:text-slate-300">هذه البيانات لا تظهر للعملاء، وتستخدمها الإدارة للتواصل وتسوية العمولات.</p></div><form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">رقم التواصل<input required name="phone" maxLength={40} defaultValue={data.ambassador.phone || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">البلد<input required name="country" maxLength={100} defaultValue={data.ambassador.country || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">طريقة التواصل المفضلة<input required name="contactMethod" maxLength={100} defaultValue={data.ambassador.contactMethod || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">طريقة استلام العمولة<input required name="payoutMethod" maxLength={100} defaultValue={data.ambassador.payoutMethod || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">بيانات الاستلام<textarea required name="payoutDetails" maxLength={2000} rows={4} defaultValue={data.ambassador.payoutDetails || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label></div><button disabled={savingProfile} className="mt-5 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60 dark:bg-[#bd9850] dark:text-slate-950">{savingProfile ? "جارٍ الحفظ..." : "حفظ البيانات"}</button></form><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">البريد الإلكتروني</dt><dd className="mt-1 break-all font-black">{data.ambassador.email}</dd></div><div><dt className="text-sm text-slate-500">سفير منذ</dt><dd className="mt-1 font-black">{formatDate(data.ambassador.joinedAt)}</dd></div></dl><Link href="/partner/forgot-password" className="mt-5 inline-flex items-center gap-2 font-black text-[#9f7d3d]">تغيير كلمة المرور <ArrowLeft size={17} /></Link></div></section>}
        </div>
      </main>
    </div>
  );
}
