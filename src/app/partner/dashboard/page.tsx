"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Home,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Percent,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DateText } from "@/components/ui/date-text";

type SectionKey = "overview" | "projects" | "dues" | "profile";
type DuesSummary = { currency: string; outstanding: string; paid: string };
type PartnerProject = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  tasks: string[];
  deliverables: string[];
  files: string[];
  updates: string[];
  feeAmount: string | null;
  feeCurrency: string;
  paymentStatus: "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
  paidAt: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};
type DashboardData = {
  isAdminPreview: boolean;
  partner: { name: string; email: string; joinedAt: string };
  stats: {
    activeProjects: number;
    completedProjects: number;
    averageProgress: number;
    duesByCurrency: DuesSummary[];
  };
  projects: PartnerProject[];
};

const navigation: { key: SectionKey; label: string; icon: typeof Home }[] = [
  { key: "overview", label: "نظرة عامة", icon: Home },
  { key: "projects", label: "المشاريع", icon: BriefcaseBusiness },
  { key: "dues", label: "مستحقات المشاريع", icon: CircleDollarSign },
  { key: "profile", label: "الملف الشخصي", icon: UserRound },
];

const projectStatus: Record<string, string> = {
  ASSIGNED: "تم الإسناد",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "قيد المراجعة",
  COMPLETED: "مكتمل",
  ON_HOLD: "متوقف مؤقتًا",
};

const projectStatusClass: Record<string, string> = {
  ASSIGNED: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  REVIEW: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  ON_HOLD: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const paymentStatus: Record<PartnerProject["paymentStatus"], string> = {
  PENDING: "قيد الاعتماد",
  APPROVED: "مستحق ومعتمد",
  PAID: "مدفوع",
  CANCELLED: "ملغى",
};

const paymentStatusClass: Record<PartnerProject["paymentStatus"], string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
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

function fileLabel(url: string, index: number) {
  try {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    return name || `ملف ${index + 1}`;
  } catch {
    return `ملف ${index + 1}`;
  }
}

function splitUpdate(value: string) {
  const separator = value.indexOf(" — ");
  if (separator < 0) return { note: value, date: null as string | null };
  const candidate = value.slice(0, separator);
  return Number.isNaN(Date.parse(candidate))
    ? { note: value, date: null as string | null }
    : { note: value.slice(separator + 3), date: candidate };
}

function DashboardWordmark() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm"><Logo size={42} /></span>
      <span className="flex flex-col">
        <span aria-label="CyberWeel" className="block h-[34px] w-[128px] bg-white" style={{ WebkitMaskImage: "url('/cyberweel-wordmark.svg')", maskImage: "url('/cyberweel-wordmark.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />
        <span className="mt-0.5 text-[10px] font-bold tracking-[0.16em] text-white/45">بوابة شركاء التنفيذ</span>
      </span>
    </span>
  );
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [darkMode, setDarkMode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const [progressDrafts, setProgressDrafts] = useState<Record<string, number>>({});

  useEffect(() => {
    setDarkMode(localStorage.getItem("cyberweel-partner-theme") === "dark");
    const previewId = new URLSearchParams(window.location.search).get("adminPreview");
    const endpoint = previewId
      ? `/api/partner/dashboard?adminPreview=${encodeURIComponent(previewId)}`
      : "/api/partner/dashboard";
    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/partner/login");
          throw new Error("غير مصرح");
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "تعذر تحميل البيانات");
        setData(payload);
        setProgressDrafts(Object.fromEntries(payload.projects.map((project: PartnerProject) => [project.id, project.progress])));
      })
      .catch((cause) => {
        if (cause instanceof Error && cause.message !== "غير مصرح") setError(cause.message);
      });
  }, [router]);

  const currentProjects = useMemo(
    () => data?.projects.filter((project) => project.status !== "COMPLETED") || [],
    [data],
  );
  const historicalProjects = useMemo(
    () => data?.projects.filter((project) => project.status === "COMPLETED") || [],
    [data],
  );

  function navigate(section: SectionKey) {
    setActiveSection(section);
    setMenuOpen(false);
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleDarkMode() {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("cyberweel-partner-theme", next ? "dark" : "light");
      return next;
    });
  }

  async function saveProgress(project: PartnerProject) {
    if (data?.isAdminPreview) {
      setError("المعاينة الإدارية للقراءة فقط.");
      return;
    }
    const progress = progressDrafts[project.id];
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setError("نسبة التقدم يجب أن تكون بين 0 و100.");
      return;
    }
    setSavingProjectId(project.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/partner/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "progress", projectId: project.id, progress }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "تعذر حفظ نسبة التقدم");
      setData((current) => current ? {
        ...current,
        projects: current.projects.map((item) => item.id === project.id ? payload.project : item),
        stats: {
          ...current.stats,
          averageProgress: Math.round(
            current.projects
              .filter((item) => item.status !== "COMPLETED")
              .reduce((total, item) => total + (item.id === project.id ? progress : item.progress), 0) /
            Math.max(1, current.projects.filter((item) => item.status !== "COMPLETED").length),
          ),
        },
      } : current);
      setNotice(`تم حفظ تقدم مشروع «${project.title}» عند ${progress}٪.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ نسبة التقدم");
    } finally {
      setSavingProjectId(null);
    }
  }

  async function logout() {
    if (data?.isAdminPreview) {
      router.push("/admin/partners");
      return;
    }
    setLoggingOut(true);
    try {
      await fetch("/api/partner/logout", { method: "POST" });
    } finally {
      router.replace("/partner/login");
      router.refresh();
    }
  }

  function ProjectCard({ project, editable = true }: { project: PartnerProject; editable?: boolean }) {
    const draft = progressDrafts[project.id] ?? project.progress;
    return (
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-5 sm:p-7 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${projectStatusClass[project.status] || projectStatusClass.ASSIGNED}`}>
                  {projectStatus[project.status] || project.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatusClass[project.paymentStatus]}`}>
                  {paymentStatus[project.paymentStatus]}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white">{project.title}</h3>
              {project.description && <p className="mt-2 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">{project.description}</p>}
            </div>
            <div className="grid min-w-52 gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2"><CalendarDays size={17} className="text-[#bd9850]" />موعد التسليم: <DateText value={project.dueAt} fallback="غير محدد" /></span>
              <span className="flex items-center gap-2"><CircleDollarSign size={17} className="text-[#bd9850]" />المستحق: {project.feeAmount ? money(project.feeAmount, project.feeCurrency) : "غير محدد"}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-2">
          <section className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-2 font-black text-slate-950 dark:text-white"><Percent size={18} className="text-[#bd9850]" />نسبة التقدم</h4>
              <strong className="text-2xl text-[#bd9850]">{draft}٪</strong>
            </div>
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-[#bd9850] transition-all" style={{ width: `${draft}%` }} />
            </div>
            {editable && project.status !== "COMPLETED" ? (
              <div className="space-y-4">
                <input aria-label="نسبة تقدم المشروع" type="range" min={0} max={100} step={1} value={draft} onChange={(event) => setProgressDrafts((current) => ({ ...current, [project.id]: Number(event.target.value) }))} className="w-full accent-[#bd9850]" />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <input type="number" min={0} max={100} value={draft} onChange={(event) => setProgressDrafts((current) => ({ ...current, [project.id]: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))} className="w-full bg-transparent text-left font-bold outline-none dark:text-white" />
                    <span className="font-bold text-slate-500">٪</span>
                  </label>
                  <button type="button" onClick={() => saveProgress(project)} disabled={savingProjectId === project.id || draft === project.progress} className="rounded-xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-[#bd9850] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#bd9850] dark:text-slate-950">
                    {savingProjectId === project.id ? "جارٍ الحفظ..." : "حفظ نسبة التقدم"}
                  </button>
                </div>
                <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">هذه هي المعلومة الوحيدة التي يمكنك تعديلها داخل المشروع.</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">المشروع مكتمل ومحفوظ ضمن السجل.</p>
            )}
          </section>

          <section className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
            <h4 className="mb-4 flex items-center gap-2 font-black text-slate-950 dark:text-white"><ListChecks size={18} className="text-[#bd9850]" />المهام</h4>
            {project.tasks.length ? <ul className="space-y-3">{project.tasks.map((task, index) => <li key={`${task}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200"><CheckCircle2 size={17} className="mt-1 shrink-0 text-[#bd9850]" />{task}</li>)}</ul> : <p className="text-sm text-slate-500">لا توجد مهام مسجلة.</p>}
          </section>

          <section className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
            <h4 className="mb-4 flex items-center gap-2 font-black text-slate-950 dark:text-white"><BriefcaseBusiness size={18} className="text-[#bd9850]" />التسليمات المطلوبة</h4>
            {project.deliverables.length ? <ul className="space-y-3">{project.deliverables.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#bd9850]" />{item}</li>)}</ul> : <p className="text-sm text-slate-500">لا توجد تسليمات مسجلة.</p>}
          </section>

          <section className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
            <h4 className="mb-4 flex items-center gap-2 font-black text-slate-950 dark:text-white"><FileText size={18} className="text-[#bd9850]" />ملفات المشروع</h4>
            {project.files.length ? <div className="space-y-2">{project.files.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#bd9850] hover:text-[#9f7d3d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><span className="truncate">{fileLabel(url, index)}</span><ArrowLeft size={16} /></a>)}</div> : <p className="text-sm text-slate-500">لا توجد ملفات مرفقة بعد.</p>}
          </section>

          <section className="rounded-2xl bg-slate-50 p-5 xl:col-span-2 dark:bg-slate-800/60">
            <h4 className="mb-4 flex items-center gap-2 font-black text-slate-950 dark:text-white"><Clock3 size={18} className="text-[#bd9850]" />تحديثات المشروع</h4>
            {project.updates.length ? <div className="grid gap-3 md:grid-cols-2">{project.updates.slice().reverse().map((value, index) => { const update = splitUpdate(value); return <div key={`${value}-${index}`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{update.note}</p>{update.date && <DateText value={update.date} className="mt-2 block text-xs text-slate-400" />}</div>; })}</div> : <p className="text-sm text-slate-500">لا توجد تحديثات مسجلة.</p>}
          </section>
        </div>
      </article>
    );
  }

  if (error && !data) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f5f1e8] p-6"><div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-slate-950">تعذر تحميل لوحة الشريك</h1><p className="mt-3 text-slate-600">{error}</p><button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">المحاولة مجددًا</button></div></main>;
  }

  if (!data) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f5f1e8]"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#bd9850] border-t-transparent" /></main>;
  }

  const outstandingLabel = data.stats.duesByCurrency.length
    ? data.stats.duesByCurrency.map((item) => money(item.outstanding, item.currency)).join(" · ")
    : "—";

  return (
    <div dir="rtl" className={darkMode ? "dark min-h-screen bg-slate-950 text-white" : "min-h-screen bg-[#f5f1e8] text-slate-950"}>
      {menuOpen && <button aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden" />}

      <aside className={`fixed inset-y-0 right-0 z-50 flex w-[310px] flex-col bg-[#101827] p-6 text-white shadow-2xl transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between gap-3">
          <DashboardWordmark />
          <button aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"><X size={22} /></button>
        </div>
        <nav className="mt-12 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;
            return <button key={item.key} type="button" onClick={() => navigate(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-right font-black transition ${active ? "bg-[#bd9850] text-slate-950" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon size={20} />{item.label}</button>;
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-[#bd9850] px-4 py-3 font-black text-slate-950"><ArrowLeft size={18} />العودة إلى الموقع</Link>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/65">تحتاج إلى مساعدة؟<br /><Link href="/contact" className="font-black text-[#d5b873]">تواصل معنا</Link></div>
        </div>
      </aside>

      <main className="min-h-screen lg:mr-[310px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f5f1e8]/90 px-4 py-4 backdrop-blur sm:px-7 lg:px-10 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button aria-label="فتح القائمة" onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-900"><Menu size={21} /></button>
              <div><p className="text-xs font-black tracking-[0.14em] text-[#9f7d3d]">{data.isAdminPreview ? "معاينة الإدارة · للقراءة فقط" : "لوحة شريك التنفيذ"}</p><h1 className="mt-1 text-lg font-black sm:text-2xl">مرحبًا، {data.partner.name}</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="تبديل المظهر" onClick={toggleDarkMode} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
              <button type="button" onClick={logout} disabled={loggingOut} className="hidden items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-black text-white hover:bg-rose-700 disabled:opacity-60 sm:flex"><LogOut size={18} />{data.isAdminPreview ? "العودة للإدارة" : loggingOut ? "جارٍ الخروج" : "تسجيل الخروج"}</button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-7 lg:p-10">
          {(error || notice) && <div className={`rounded-2xl border px-5 py-4 text-sm font-bold ${error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}>{error || notice}</div>}

          {activeSection === "overview" && <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "المشاريع النشطة", value: data.stats.activeProjects, icon: BriefcaseBusiness },
                { label: "المشاريع المكتملة", value: data.stats.completedProjects, icon: CheckCircle2 },
                { label: "متوسط التقدم", value: `${data.stats.averageProgress}٪`, icon: Percent },
                { label: "المستحقات غير المدفوعة", value: outstandingLabel, icon: CircleDollarSign },
              ].map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500 dark:text-slate-400">{card.label}</p><strong className="mt-3 block text-2xl font-black text-slate-950 dark:text-white">{card.value}</strong></div><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15 dark:text-[#d5b873]"><Icon size={22} /></span></div></div>; })}
            </section>

            <section className="rounded-3xl bg-[#101827] p-6 text-white shadow-xl sm:p-8">
              <p className="text-sm font-black text-[#d5b873]">مساحة عملك المباشرة</p>
              <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div><h2 className="text-2xl font-black sm:text-3xl">ابدأ من المشروع المحال لك</h2><p className="mt-3 max-w-3xl leading-8 text-white/65">ستجد المهام والتسليمات والملفات والتحديثات والموعد والمستحقات في مكان واحد. لا يمكنك تغيير تفاصيل المشروع؛ فقط حدّث نسبة تقدمه بدقة.</p></div>
                <button type="button" onClick={() => navigate("projects")} className="shrink-0 rounded-2xl bg-[#bd9850] px-6 py-3 font-black text-slate-950">فتح المشاريع</button>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-black text-[#9f7d3d]">قيد العمل الآن</p><h2 className="mt-1 text-2xl font-black">المشاريع الحالية</h2></div></div>
              <div className="space-y-5">{currentProjects.length ? currentProjects.slice(0, 2).map((project) => <ProjectCard key={project.id} project={project} />) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60">لا يوجد مشروع محال إليك حاليًا.</div>}</div>
            </section>
          </>}

          {activeSection === "projects" && <section className="space-y-8">
            <div><p className="text-sm font-black text-[#9f7d3d]">نطاقك التنفيذي فقط</p><h2 className="mt-1 text-3xl font-black">المشاريع المحالة إليك</h2><p className="mt-2 text-slate-600 dark:text-slate-300">لا تظهر هنا إلا المشاريع المرتبطة بحسابك.</p></div>
            <div className="space-y-5"><h3 className="text-xl font-black">المشاريع الحالية</h3>{currentProjects.length ? currentProjects.map((project) => <ProjectCard key={project.id} project={project} editable={!data.isAdminPreview} />) : <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">لا توجد مشاريع حالية.</div>}</div>
            <div className="space-y-5"><h3 className="text-xl font-black">سجل المشاريع المكتملة</h3>{historicalProjects.length ? historicalProjects.map((project) => <ProjectCard key={project.id} project={project} editable={false} />) : <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">لا توجد مشاريع مكتملة بعد.</div>}</div>
          </section>}

          {activeSection === "dues" && <section className="space-y-6">
            <div><p className="text-sm font-black text-[#9f7d3d]">الحالي والسابق</p><h2 className="mt-1 text-3xl font-black">مستحقات المشاريع</h2><p className="mt-2 text-slate-600 dark:text-slate-300">كل مبلغ مرتبط بمشروع محدد وحالة دفع واضحة.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">{data.stats.duesByCurrency.map((item) => <div key={item.currency} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><p className="font-bold text-slate-500">{item.currency}</p><div className="mt-4 grid grid-cols-2 gap-4"><div><span className="text-xs text-slate-500">غير مدفوع</span><strong className="mt-1 block text-xl">{money(item.outstanding, item.currency)}</strong></div><div><span className="text-xs text-slate-500">مدفوع سابقًا</span><strong className="mt-1 block text-xl">{money(item.paid, item.currency)}</strong></div></div></div>)}</div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right"><thead className="bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-5 py-4">المشروع</th><th className="px-5 py-4">الفترة</th><th className="px-5 py-4">المبلغ</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">تاريخ الدفع</th></tr></thead><tbody>{data.projects.map((project) => <tr key={project.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-black">{project.title}</td><td className="px-5 py-4 text-sm text-slate-500">{project.status === "COMPLETED" ? "سابق" : "حالي"}</td><td className="px-5 py-4 font-bold">{project.feeAmount ? money(project.feeAmount, project.feeCurrency) : "غير محدد"}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${paymentStatusClass[project.paymentStatus]}`}>{paymentStatus[project.paymentStatus]}</span></td><td className="px-5 py-4 text-sm text-slate-500"><DateText value={project.paidAt} /></td></tr>)}</tbody></table></div>
            </div>
          </section>}

          {activeSection === "profile" && <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-black text-[#9f7d3d]">بيانات الحساب</p><h2 className="mt-1 text-3xl font-black">الملف الشخصي</h2>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800"><dt className="text-sm text-slate-500">الاسم</dt><dd className="mt-2 font-black">{data.partner.name}</dd></div><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800"><dt className="text-sm text-slate-500">البريد الإلكتروني</dt><dd className="mt-2 break-all font-black">{data.partner.email}</dd></div><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800"><dt className="text-sm text-slate-500">عضو منذ</dt><dd className="mt-2 font-black"><DateText value={data.partner.joinedAt} /></dd></div><div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800"><dt className="text-sm text-slate-500">نوع الحساب</dt><dd className="mt-2 font-black">شريك تنفيذ</dd></div></dl>
            <Link href="/partner/forgot-password" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white dark:bg-[#bd9850] dark:text-slate-950">تغيير كلمة المرور <ArrowLeft size={17} /></Link>
          </section>}
        </div>
      </main>
    </div>
  );
}
