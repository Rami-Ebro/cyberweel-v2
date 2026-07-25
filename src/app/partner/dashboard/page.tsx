"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  Copy,
  CreditCard,
  Home,
  Link2,
  LogOut,
  Mail,
  Menu,
  Moon,
  Phone,
  Sun,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

type SectionKey = "overview" | "referrals" | "projects" | "commissions" | "payments" | "referral" | "profile";
type Referral = { id: string; name: string | null; email: string | null; phone: string | null; status: string; createdAt: string };
type DashboardData = {
  partner: { name: string; email: string; code: string; referralUrl: string; joinedAt: string };
  stats: { referrals: number; projects: number; totalCommissions: number; dueBalance: number };
  referrals: Referral[];
  projects: unknown[];
  commissions: unknown[];
  payments: unknown[];
};

const navigation: { key: SectionKey; label: string; icon: typeof Home }[] = [
  { key: "overview", label: "نظرة عامة", icon: Home },
  { key: "referrals", label: "العملاء المحالون", icon: UsersRound },
  { key: "projects", label: "المشاريع", icon: BriefcaseBusiness },
  { key: "commissions", label: "العمولات", icon: CircleDollarSign },
  { key: "payments", label: "الدفعات", icon: CreditCard },
  { key: "referral", label: "رابط الإحالة", icon: Link2 },
  { key: "profile", label: "الملف الشخصي", icon: UserRound },
];

const referralStatus: Record<string, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  QUALIFIED: "مؤهل",
  CONVERTED: "تحوّل إلى مشروع",
  REJECTED: "غير مناسب",
};

const referralStatusClass: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-800",
  CONTACTED: "bg-amber-100 text-amber-800",
  QUALIFIED: "bg-violet-100 text-violet-800",
  CONVERTED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function readStoredIds(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function DashboardWordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm"><Logo size={42} /></span>
      <span className="flex flex-col">
        <span aria-label="CyberWeel" className="block h-[34px] w-[128px] bg-white" style={{ WebkitMaskImage: "url('/cyberweel-wordmark.svg')", maskImage: "url('/cyberweel-wordmark.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />
        <span className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-white/45">بوابة الشركاء</span>
      </span>
    </span>
  );
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [alertSeenIds, setAlertSeenIds] = useState<string[]>([]);
  const [listSeenIds, setListSeenIds] = useState<string[]>([]);
  const [visibleNewReferralIds, setVisibleNewReferralIds] = useState<string[]>([]);

  useEffect(() => {
    setDarkMode(localStorage.getItem("cyberweel-partner-theme") === "dark");
    fetch("/api/partner/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/partner/login");
          throw new Error("غير مصرح");
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "تعذر تحميل البيانات");
        const partnerCode = payload.partner.code as string;
        setAlertSeenIds(readStoredIds(`cyberweel-referral-alert-seen:${partnerCode}`));
        setListSeenIds(readStoredIds(`cyberweel-referral-list-seen:${partnerCode}`));
        setData(payload);
      })
      .catch((cause) => {
        if (cause instanceof Error && cause.message !== "غير مصرح") setError(cause.message);
      });
  }, [router]);

  function persistIds(kind: "alert" | "list", ids: string[]) {
    if (!data) return;
    localStorage.setItem(`cyberweel-referral-${kind}-seen:${data.partner.code}`, JSON.stringify(ids));
  }

  function markAlertSeen(id: string) {
    setAlertSeenIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      persistIds("alert", next);
      return next;
    });
  }

  function openReferrals() {
    if (data) {
      const firstViewIds = data.referrals
        .filter((item) => item.status === "NEW" && !listSeenIds.includes(item.id))
        .map((item) => item.id);
      setVisibleNewReferralIds(firstViewIds);
      if (firstViewIds.length) {
        const next = Array.from(new Set([...listSeenIds, ...firstViewIds]));
        setListSeenIds(next);
        persistIds("list", next);
      }
    }
    setActiveSection("referrals");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function markListItemSeen(id: string) {
    setVisibleNewReferralIds((current) => current.filter((item) => item !== id));
  }

  function toggleDarkMode() {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("cyberweel-partner-theme", next ? "dark" : "light");
      return next;
    });
  }

  function navigate(section: SectionKey) {
    if (section === "referrals") {
      openReferrals();
      return;
    }
    setActiveSection(section);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyReferralLink() {
    if (!data) return;
    await navigator.clipboard.writeText(data.partner.referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/partner/logout", { method: "POST" });
    router.push("/partner/login");
    router.refresh();
  }

  const card = darkMode ? "border-white/10 bg-[#182235] text-white" : "border-[#D8D2C4] bg-white text-[#111827]";
  const muted = darkMode ? "text-slate-300" : "text-slate-500";
  const soft = darkMode ? "bg-white/5" : "bg-[#F7F3EB]";

  const Navigation = () => (
    <nav className="space-y-1.5">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.key === activeSection;
        return <button key={item.key} type="button" onClick={() => navigate(item.key)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-semibold transition ${active ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5" /><span>{item.label}</span></button>;
      })}
    </nav>
  );

  function empty(title: string, text: string) {
    return <section className={`rounded-2xl border p-8 text-center shadow-sm ${card}`}><h2 className="text-xl font-extrabold">{title}</h2><p className={`mt-3 text-sm ${muted}`}>{text}</p></section>;
  }

  function referralCard(item: Referral) {
    const showNew = item.status === "NEW" && visibleNewReferralIds.includes(item.id);
    return (
      <article key={item.id} onClick={() => showNew && markListItemSeen(item.id)} className={`rounded-2xl border border-current/10 p-5 ${soft} ${showNew ? "cursor-pointer ring-2 ring-sky-400/40" : ""}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold">{item.name || "عميل دون اسم"}</h3>
            <div className={`mt-3 space-y-2 text-sm ${muted}`}>
              {item.email && <a href={`mailto:${item.email}`} className="flex items-center gap-2 break-all hover:text-[#B89A5A]"><Mail className="h-4 w-4 shrink-0" /><span dir="ltr">{item.email}</span></a>}
              {item.phone && <a href={`tel:${item.phone}`} className="flex items-center gap-2 hover:text-[#B89A5A]"><Phone className="h-4 w-4 shrink-0" /><span dir="ltr">{item.phone}</span></a>}
              {!item.email && !item.phone && <p>لا توجد وسيلة تواصل</p>}
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" />تاريخ الإحالة: {formatDate(item.createdAt)}</p>
            </div>
          </div>
          {item.status !== "NEW" && <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-extrabold ${referralStatusClass[item.status] || "bg-slate-100 text-slate-700"}`}>{referralStatus[item.status] || item.status}</span>}
          {showNew && <span className="w-fit rounded-full bg-sky-100 px-3 py-1.5 text-xs font-extrabold text-sky-800">جديد</span>}
        </div>
      </article>
    );
  }

  function renderContent() {
    if (!data) return null;

    if (activeSection === "referrals") {
      return (
        <section className={`rounded-2xl border p-6 shadow-sm ${card}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold text-[#B89A5A]">سجل الإحالات</p><h2 className="mt-1 text-2xl font-extrabold">العملاء المحالون</h2><p className={`mt-2 text-sm ${muted}`}>كل الإحالات الجديدة والسابقة مع حالتها الحالية.</p></div>
            <div className={`w-fit rounded-xl px-4 py-2 text-sm font-bold ${soft}`}>الإجمالي: {data.referrals.length}</div>
          </div>
          {data.referrals.length === 0 ? <p className={`mt-6 text-sm ${muted}`}>لم تُسجل أي إحالة بعد.</p> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{data.referrals.map(referralCard)}</div>}
        </section>
      );
    }

    if (activeSection === "projects") return empty("المشاريع", "لا توجد مشاريع مرتبطة بالإحالات حتى الآن.");
    if (activeSection === "commissions") return empty("العمولات", "لا توجد عمولات مسجلة حتى الآن.");
    if (activeSection === "payments") return empty("الدفعات", "لا توجد دفعات مسجلة حتى الآن.");

    if (activeSection === "referral") return <section className="mx-auto max-w-2xl rounded-2xl bg-[#111827] p-7 text-white shadow-sm"><p className="text-xs font-bold text-[#B89A5A]">رابط الإحالة الخاص بك</p><h2 className="mt-2 text-2xl font-extrabold">شارك الرابط وابدأ الإحالة</h2><p className="mt-2 text-sm text-white/60">الكود: {data.partner.code}</p><div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"><code dir="ltr" className="min-w-0 flex-1 truncate px-2 text-sm">{data.partner.referralUrl}</code><button type="button" onClick={copyReferralLink} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-[#B89A5A] text-[#111827]">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button></div>{copied && <p className="mt-3 text-sm font-bold text-emerald-300">تم نسخ الرابط</p>}</section>;

    if (activeSection === "profile") return <section className={`mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm ${card}`}><h2 className="text-xl font-extrabold">الملف الشخصي</h2><div className="mt-5 space-y-4"><div><p className={`text-xs ${muted}`}>الاسم</p><p className="font-bold">{data.partner.name}</p></div><div><p className={`text-xs ${muted}`}>البريد الإلكتروني</p><p className="font-bold">{data.partner.email}</p></div><div><p className={`text-xs ${muted}`}>كود الإحالة</p><p className="font-bold">{data.partner.code}</p></div><Link href="/partner/forgot-password" className="inline-block rounded-xl bg-[#B89A5A] px-5 py-3 font-bold text-[#111827]">تغيير كلمة المرور</Link></div></section>;

    const newReferrals = data.referrals.filter((item) => item.status === "NEW" && !alertSeenIds.includes(item.id));
    const stats = [
      ["العملاء المحالون", data.stats.referrals],
      ["المشاريع النشطة", data.stats.projects],
      ["إجمالي العمولات", `$${data.stats.totalCommissions}`],
      ["الرصيد المستحق", `$${data.stats.dueBalance}`],
    ];

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => <article key={String(label)} className={`rounded-2xl border p-5 shadow-sm ${card}`}><p className={`text-sm font-semibold ${muted}`}>{label}</p><p className="mt-3 text-3xl font-black">{value}</p></article>)}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <section className={`rounded-2xl border p-6 shadow-sm ${card}`}>
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-bold text-[#B89A5A]">تنبيه جديد</p><h2 className="mt-1 text-xl font-extrabold">الإحالات الجديدة</h2></div>
              {newReferrals.length > 0 && <span className="grid h-9 min-w-9 place-items-center rounded-full bg-red-600 px-3 text-sm font-black text-white">{newReferrals.length}</span>}
            </div>
            {newReferrals.length === 0 ? (
              <p className={`mt-5 text-sm ${muted}`}>لا توجد إحالات جديدة الآن.</p>
            ) : (
              <div className="mt-5 space-y-3">
                {newReferrals.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => { markAlertSeen(item.id); openReferrals(); }} className={`flex w-full cursor-pointer flex-col gap-3 rounded-xl p-4 text-right transition hover:scale-[1.01] sm:flex-row sm:items-center sm:justify-between ${soft}`}><div><p className="font-bold">{item.name || "عميل دون اسم"}</p><p className={`text-sm ${muted}`}>{item.email || item.phone || "لا توجد وسيلة تواصل"}</p><p className={`mt-1 text-xs ${muted}`}>{formatDate(item.createdAt)}</p></div><span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-800">جديد</span></button>)}
                <button type="button" onClick={openReferrals} className="cursor-pointer text-sm font-bold text-[#B89A5A]">عرض كل الإحالات</button>
              </div>
            )}
          </section>
          <section className="rounded-2xl bg-[#111827] p-6 text-white">
            <p className="text-xs font-bold text-[#B89A5A]">رابط الإحالة</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"><code dir="ltr" title={data.partner.referralUrl} className="min-w-0 flex-1 truncate px-2 text-xs text-white/80">{data.partner.referralUrl}</code><button type="button" onClick={copyReferralLink} aria-label="نسخ رابط الإحالة" className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg bg-[#B89A5A] text-[#111827]">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button></div>
            {copied && <p className="mt-3 text-sm font-bold text-emerald-300">تم نسخ الرابط</p>}
          </section>
        </div>
      </>
    );
  }

  if (error) return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#F7F3EB] p-4"><div className="max-w-md rounded-2xl bg-white p-7 text-center shadow-xl"><h1 className="text-xl font-extrabold">تعذر تحميل لوحة الشريك</h1><p className="mt-3 text-sm text-red-700">{error}</p><button type="button" onClick={() => location.reload()} className="mt-5 rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">إعادة المحاولة</button></div></main>;

  return (
    <main dir="rtl" className={`min-h-screen transition-colors ${darkMode ? "bg-[#0B1220] text-white" : "bg-[#F7F3EB] text-[#111827]"}`}>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 bg-[#111827] px-5 py-7 text-white lg:flex lg:flex-col">
          <Link href="/" className="mb-10"><DashboardWordmark /></Link>
          <Navigation />
          <div className="mt-auto space-y-3">
            <Link href="/" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B89A5A] px-4 py-3 text-sm font-extrabold text-[#111827] transition hover:bg-[#C7AA68]">العودة إلى الموقع <ArrowLeft className="h-4 w-4" /></Link>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-bold">تحتاج إلى مساعدة؟</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#B89A5A]">تواصل معنا <ArrowLeft className="h-4 w-4" /></Link></div>
          </div>
        </aside>
        {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-black/45" onClick={() => setMenuOpen(false)} /><aside className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-[#111827] px-5 py-6 text-white"><div className="mb-8 flex items-center justify-between"><DashboardWordmark /><button type="button" onClick={() => setMenuOpen(false)}><X /></button></div><Navigation /><Link href="/" className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#B89A5A] px-4 py-3 text-sm font-extrabold text-[#111827]">العودة إلى الموقع <ArrowLeft className="h-4 w-4" /></Link></aside></div>}
        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className={`mb-6 flex items-center justify-between rounded-2xl border px-4 py-4 shadow-sm sm:px-6 ${card}`}><div><p className="text-xs font-bold text-[#B89A5A]">لوحة تحكم الشريك</p><h1 className="mt-1 text-xl font-extrabold sm:text-2xl">{data ? `مرحبًا، ${data.partner.name}` : "جارٍ تحميل بياناتك..."}</h1></div><div className="flex items-center gap-2"><button type="button" onClick={toggleDarkMode} className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-current/15" aria-label={darkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الليلي"}>{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button><button type="button" disabled={loggingOut} onClick={logout} className="hidden cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 sm:flex"><LogOut className="h-4 w-4" />{loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}</button><button type="button" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-current/15 lg:hidden"><Menu className="h-5 w-5" /></button></div></header>
          {!data ? <div className={`rounded-2xl border p-8 text-center shadow-sm ${card}`}>جارٍ تحميل البيانات الحقيقية...</div> : renderContent()}
        </section>
      </div>
    </main>
  );
}
