"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Copy,
  CreditCard,
  Home,
  Link2,
  LogOut,
  Menu,
  Settings,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

type SectionKey = "overview" | "referrals" | "projects" | "commissions" | "payments" | "referral" | "profile";

const referralUrl = "https://cyberweel.com/ref/CW-0001";

const navigation: { key: SectionKey; label: string; icon: typeof Home }[] = [
  { key: "overview", label: "نظرة عامة", icon: Home },
  { key: "referrals", label: "العملاء المحالون", icon: UsersRound },
  { key: "projects", label: "المشاريع", icon: BriefcaseBusiness },
  { key: "commissions", label: "العمولات", icon: CircleDollarSign },
  { key: "payments", label: "الدفعات", icon: CreditCard },
  { key: "referral", label: "رابط الإحالة", icon: Link2 },
  { key: "profile", label: "الملف الشخصي", icon: UserRound },
];

const referrals = [
  { name: "أحمد الخالد", contact: "ahmad@example.com", status: "تحوّل إلى مشروع" },
  { name: "سارة المحمد", contact: "+963 9xx xxx xxx", status: "قيد المتابعة" },
  { name: "محمد العلي", contact: "mohammad@example.com", status: "جديد" },
];

const projects = [
  { client: "أحمد الخالد", project: "متجر إلكتروني", value: "$2,500", commission: "$500", status: "مكتمل" },
  { client: "سارة المحمد", project: "موقع شركة", value: "$1,200", commission: "$240", status: "مكتمل" },
  { client: "محمد العلي", project: "حملة إعلانية", value: "$800", commission: "$120", status: "قيد التنفيذ" },
];

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

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-[#D8D2C4] bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
    </section>
  );
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function navigate(section: SectionKey) {
    setActiveSection(section);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyReferralLink() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/partner/logout", { method: "POST" });
    router.push("/partner/login");
    router.refresh();
  }

  const Navigation = () => (
    <nav className="space-y-1.5">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.key === activeSection;
        return (
          <button key={item.key} type="button" onClick={() => navigate(item.key)} className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-semibold transition ${active ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  function renderContent() {
    if (activeSection === "referrals") {
      return <section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">العملاء المحالون</h2><div className="mt-5 space-y-3">{referrals.map((item) => <div key={item.name} className="flex flex-col justify-between gap-2 rounded-xl bg-[#F7F3EB] p-4 sm:flex-row"><div><p className="font-bold">{item.name}</p><p className="text-sm text-slate-500">{item.contact}</p></div><span className="text-sm font-bold text-[#9A7D43]">{item.status}</span></div>)}</div></section>;
    }

    if (activeSection === "projects") {
      return <section className="overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white shadow-sm"><div className="border-b border-[#D8D2C4] p-5"><h2 className="text-xl font-extrabold">المشاريع</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-[#FAF8F3]"><tr><th className="p-4 text-right">العميل</th><th className="p-4 text-right">المشروع</th><th className="p-4 text-right">القيمة</th><th className="p-4 text-right">عمولتك</th><th className="p-4 text-right">الحالة</th></tr></thead><tbody>{projects.map((row) => <tr key={row.client} className="border-t border-[#E8E2D8]"><td className="p-4 font-bold">{row.client}</td><td className="p-4">{row.project}</td><td className="p-4">{row.value}</td><td className="p-4 font-bold text-[#9A7D43]">{row.commission}</td><td className="p-4">{row.status}</td></tr>)}</tbody></table></div></section>;
    }

    if (activeSection === "commissions") return <EmptyCard title="العمولات" text="سيظهر هنا تفصيل العمولات المكتسبة والمعلقة بعد ربط البيانات الفعلية." />;
    if (activeSection === "payments") return <EmptyCard title="الدفعات" text="سيظهر هنا سجل الدفعات ومواعيد الاستحقاق وطريقة الدفع." />;

    if (activeSection === "referral") {
      return <section className="mx-auto max-w-2xl rounded-2xl bg-[#111827] p-7 text-white shadow-sm"><p className="text-xs font-bold text-[#B89A5A]">رابط الإحالة الخاص بك</p><h2 className="mt-2 text-2xl font-extrabold">شارك الرابط وابدأ الإحالة</h2><div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"><code dir="ltr" className="min-w-0 flex-1 truncate px-2 text-sm">{referralUrl}</code><button type="button" onClick={copyReferralLink} className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-[#B89A5A] text-[#111827]">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button></div>{copied && <p className="mt-3 text-sm font-bold text-emerald-300">تم نسخ الرابط</p>}</section>;
    }

    if (activeSection === "profile") {
      return <section className="mx-auto max-w-2xl rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">الملف الشخصي</h2><div className="mt-5 space-y-4"><div><p className="text-xs text-slate-500">الاسم</p><p className="font-bold">حمدو</p></div><div><p className="text-xs text-slate-500">البريد الإلكتروني</p><p className="font-bold">partner.test3@cyberweel.com</p></div><button type="button" onClick={() => setSettingsOpen(true)} className="cursor-pointer rounded-xl bg-[#111827] px-5 py-3 font-bold text-white">فتح الإعدادات</button></div></section>;
    }

    return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["العملاء المحالون", "24"], ["المشاريع النشطة", "7"], ["إجمالي العمولات", "$8,450"], ["الرصيد المستحق", "$520"],
    ].map(([label, value]) => <article key={label} className="rounded-2xl border border-[#D8D2C4] bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></article>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]"><section className="rounded-2xl border border-[#D8D2C4] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-extrabold">آخر المشاريع</h2><button type="button" onClick={() => navigate("projects")} className="cursor-pointer font-bold text-[#9A7D43]">عرض الكل</button></div><div className="mt-5 space-y-3">{projects.slice(0, 3).map((row) => <div key={row.client} className="flex justify-between rounded-xl bg-[#F7F3EB] p-4"><div><p className="font-bold">{row.client}</p><p className="text-sm text-slate-500">{row.project}</p></div><span className="font-bold text-[#9A7D43]">{row.commission}</span></div>)}</div></section><section className="rounded-2xl bg-[#111827] p-6 text-white"><p className="text-xs font-bold text-[#B89A5A]">رابط الإحالة</p><p className="mt-2 text-sm text-white/60">انسخه وشاركه مع العملاء المحتملين</p><button type="button" onClick={() => navigate("referral")} className="mt-5 w-full cursor-pointer rounded-xl bg-[#B89A5A] px-4 py-3 font-bold text-[#111827]">عرض الرابط</button></section></div></>;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 bg-[#111827] px-5 py-7 text-white lg:flex lg:flex-col"><Link href="/" className="mb-10"><DashboardWordmark /></Link><Navigation /><div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-bold">تحتاج إلى مساعدة؟</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#B89A5A]">تواصل معنا <ArrowLeft className="h-4 w-4" /></Link></div></aside>

        {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" className="absolute inset-0 bg-black/45" onClick={() => setMenuOpen(false)} /><aside className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-[#111827] px-5 py-6 text-white"><div className="mb-8 flex items-center justify-between"><DashboardWordmark /><button type="button" onClick={() => setMenuOpen(false)}><X /></button></div><Navigation /></aside></div>}

        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex items-center justify-between rounded-2xl border border-[#D8D2C4] bg-white px-4 py-4 shadow-sm sm:px-6"><div><p className="text-xs font-bold text-[#B89A5A]">لوحة تحكم الشريك</p><h1 className="mt-1 text-xl font-extrabold sm:text-2xl">صباح الخير، حمدو</h1></div><div className="flex items-center gap-2"><button type="button" onClick={() => setSettingsOpen(true)} className="hidden cursor-pointer items-center gap-2 rounded-xl border border-[#D8D2C4] px-4 py-2 text-sm font-bold sm:flex"><Settings className="h-4 w-4" /> الإعدادات</button><button type="button" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-[#D8D2C4] lg:hidden"><Menu className="h-5 w-5" /></button></div></header>
          {renderContent()}
        </section>
      </div>

      {settingsOpen && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">الإعدادات</h2><button type="button" onClick={() => setSettingsOpen(false)} className="cursor-pointer rounded-lg p-2 hover:bg-[#F7F3EB]"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-3"><button type="button" onClick={() => { setSettingsOpen(false); navigate("profile"); }} className="w-full cursor-pointer rounded-xl border border-[#D8D2C4] px-4 py-3 text-right font-bold">الملف الشخصي</button><Link href="/partner/forgot-password" className="block rounded-xl border border-[#D8D2C4] px-4 py-3 font-bold">تغيير كلمة المرور</Link><button type="button" disabled={loggingOut} onClick={logout} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-60"><LogOut className="h-4 w-4" />{loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}</button></div></div></div>}
    </main>
  );
}
