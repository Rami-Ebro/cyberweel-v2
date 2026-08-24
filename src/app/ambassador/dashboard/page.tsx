"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Bot,
  BookOpenText,
  Check,
  CircleDollarSign,
  Copy,
  Download,
  Filter,
  Home,
  Link2,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  QrCode,
  Search,
  Send,
  Share2,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DateText } from "@/components/ui/date-text";
import { dashboardErrorMessage, dashboardLabel } from "@/lib/dashboard-labels";
import { useDashboardI18n } from "@/components/dashboard-i18n-provider";

type SectionKey = "overview" | "tools" | "referrals" | "rewards" | "profile";
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
  updatedAt: string;
  clientProject: {
    title: string;
    currency: string;
    ambassadorRewardRate: string | null;
  } | null;
};
type CommissionSummary = {
  currency: string;
  pending: string;
  approved: string;
  paid: string;
  cancelled: string;
};
type RewardStatus = "EXPECTED" | "EARNED" | "PAID" | "CANCELLED";
type RewardSummary = { currency: string; total: string; expected: string; earned: string; paid: string };
type RewardLevel = { id: string; name: string; minSuccessfulReferrals: number; rate: string };
type PaymentProof = { method: string; reference: string; paidAt: string; note: string | null };
type Reward = {
  id: string; rate: string; baseAmount: string; amount: string; currency: string; status: RewardStatus;
  earnedAt: string | null; paidAt: string | null; paymentProof: PaymentProof | null;
  referral: { name: string | null; email: string | null };
  project: { title: string; client: { name: string | null; email: string } };
  projectStage: { name: string };
};
type DashboardData = {
  isAdminPreview: boolean;
  ambassador: {
    id: string;
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
    followUp: number;
    converted: number;
    qualified: number;
    commissionsByCurrency: CommissionSummary[];
    rewardsByCurrency: RewardSummary[];
    rewardLevels: RewardLevel[];
    monthlyLevel: { successfulReferrals: number; name: string; rate: string; nextRate: string | null; nextTarget: number | null; remaining: number };
  };
  referrals: Referral[];
  rewards: Reward[];
};

const navigation: { key: SectionKey; label: string; icon: typeof Home }[] = [
  { key: "overview", label: "نظرة عامة", icon: Home },
  { key: "tools", label: "أدوات السفير", icon: Sparkles },
  { key: "referrals", label: "إحالاتي", icon: UsersRound },
  { key: "rewards", label: "مكافآتي", icon: BadgeDollarSign },
  { key: "profile", label: "الملف الشخصي", icon: UserRound },
];

const referralStatus: Record<string, string> = {
  NEW: "جديدة",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم",
  AWAITING_RESPONSE: "بانتظار الرد",
  NOT_INTERESTED: "غير مهتم",
  CONVERTED: "تحولت إلى عميل",
  "قيد التفاوض": "قيد التفاوض",
  "تم الاتفاق — بانتظار أول دفعة": "تم الاتفاق — بانتظار أول دفعة",
  "إحالة ناجحة": "إحالة ناجحة",
};

const directReferralSuccess = "تم استلام الإحالة — بانتظار مراجعة الإدارة.";

type AssistantMode = "START_CONVERSATION" | "WHATSAPP_MESSAGE" | "RECOMMEND_SERVICE" | "EXPLAIN_CYBERWEEL" | "HANDLE_PRICE_OBJECTION" | "DISCOVERY_QUESTIONS";

const assistantModes: { value: AssistantMode; label: string }[] = [
  { value: "START_CONVERSATION", label: "كيف أبدأ الحديث معه؟" },
  { value: "WHATSAPP_MESSAGE", label: "اكتب لي رسالة واتساب" },
  { value: "RECOMMEND_SERVICE", label: "ما الخدمة المناسبة له؟" },
  { value: "EXPLAIN_CYBERWEEL", label: "كيف أشرح له CyberWeel؟" },
  { value: "HANDLE_PRICE_OBJECTION", label: "كيف أرد على اعتراض السعر؟" },
  { value: "DISCOVERY_QUESTIONS", label: "أسئلة لفهم احتياجه" },
];

const readyContent = [
  {
    id: "about",
    title: { ar: "تعريف CyberWeel", en: "About CyberWeel" },
    text: {
      ar: "CyberWeel تساعد أصحاب الأعمال على فهم المشكلة الحقيقية أولًا، ثم اختيار وتنفيذ الحل الرقمي أو التشغيلي المناسب دون تعقيد أو وعود مبالغ فيها.",
      en: "CyberWeel helps business owners clarify the real problem first, then choose and build the right digital or operational solution without unnecessary complexity or inflated promises.",
    },
  },
  {
    id: "whatsapp-first",
    title: { ar: "رسالة واتساب أولى", en: "First WhatsApp Message" },
    text: {
      ar: "مرحبًا، تذكرت مشروعك لأن CyberWeel تبدأ بفهم التحدي قبل اقتراح أي خدمة. إذا أحببت، أخبرني باختصار ما الذي تريد تحسينه وسأوصلك بالفريق المناسب.",
      en: "Hi, your business came to mind because CyberWeel starts by understanding the challenge before suggesting a service. If you like, tell me briefly what you want to improve and I can connect you with the right team.",
    },
  },
  {
    id: "follow-up",
    title: { ar: "رسالة متابعة", en: "Follow-up Message" },
    text: {
      ar: "مرحبًا مجددًا، أردت فقط متابعة حديثنا. إن كان التحدي ما زال قائمًا، يمكن لفريق CyberWeel مراجعة وضعك واقتراح الخطوة العملية الأنسب دون التزام مسبق.",
      en: "Hi again, I just wanted to follow up on our conversation. If the challenge is still relevant, CyberWeel can review your situation and suggest the most sensible next step with no prior commitment.",
    },
  },
  {
    id: "short-post",
    title: { ar: "منشور قصير", en: "Short Post" },
    text: {
      ar: "ليست كل مشكلة تحتاج مشروعًا ضخمًا. أحيانًا تبدأ النقلة الصحيحة بسؤال واضح وقرار ذكي. شارك تحديك مع CyberWeel ودعنا نحدد الخطوة التالية.",
      en: "Not every problem needs a huge project. Sometimes real progress starts with a clear question and a sound decision. Share your challenge with CyberWeel and define the next step.",
    },
  },
  {
    id: "story",
    title: { ar: "Story", en: "Story" },
    text: {
      ar: "عندك مشكلة في مشروعك ولا تعرف هل تحتاج موقعًا، نظامًا، أتمتة أم شيئًا أبسط؟ ابدأ بالمشكلة، وCyberWeel تساعدك على تحديد القرار الصحيح.",
      en: "Facing a business problem and unsure whether you need a website, system, automation, or something simpler? Start with the problem—CyberWeel helps you define the right decision.",
    },
  },
  {
    id: "services",
    title: { ar: "ماذا تقدم CyberWeel؟", en: "What Does CyberWeel Offer?" },
    text: {
      ar: "تبدأ CyberWeel بتحليل احتياج العمل، ثم تساعد في الحلول الرقمية المناسبة مثل المواقع والمنصات والأنظمة والأتمتة والذكاء الاصطناعي والحماية الرقمية والتحليل ودعم القرار.",
      en: "CyberWeel starts by clarifying the business need, then helps with suitable digital solutions such as websites, platforms, custom systems, automation, practical AI, cybersecurity, analysis, and decision support.",
    },
  },
  {
    id: "price",
    title: { ar: "الرد على سؤال السعر", en: "Answering the Price Question" },
    text: {
      ar: "السعر يعتمد على المشكلة والنطاق الفعلي، لذلك لا نضع رقمًا قبل الفهم. أرسل احتياجك لفريق CyberWeel وسيحدد معك الحل المناسب ثم يقدم تقديرًا معتمدًا وواضحًا.",
      en: "Pricing depends on the actual problem and scope, so we do not quote before understanding them. Share your need with CyberWeel and the team will define the right solution before providing an approved, clear estimate.",
    },
  },
  {
    id: "invite",
    title: { ar: "دعوة العميل للتواصل", en: "Invite the Client to Talk" },
    text: {
      ar: "اكتب مشكلتك أو فكرتك كما هي، حتى لو لم تكن مرتبة. فريق CyberWeel سيقرأها ويساعدك على فهم الخطوة التالية بوضوح.",
      en: "Describe your problem or idea as it is, even if it is not polished. CyberWeel will review it and help you clarify the next step.",
    },
  },
];

const referralStatusClass: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  CONTACTED: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  INTERESTED: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  AWAITING_RESPONSE: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  NOT_INTERESTED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  CONVERTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  "قيد التفاوض": "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  "تم الاتفاق — بانتظار أول دفعة": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "إحالة ناجحة": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
};

const commissionStatus: Record<CommissionStatus, string> = {
  VERIFYING: "قيد التحقق",
  ON_HOLD: "معلّقة",
  NOT_ELIGIBLE: "غير مؤهلة",
  DUE: "بانتظار الدفع",
  PAID: "مدفوعة",
};

const commissionStatusClass: Record<CommissionStatus, string> = {
  VERIFYING: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  ON_HOLD: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  NOT_ELIGIBLE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  DUE: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
};

const rewardStatus: Record<RewardStatus, string> = { EXPECTED: "متوقعة", EARNED: "متوقعة", PAID: "مدفوعة", CANCELLED: "ملغاة" };
const rewardStatusClass: Record<RewardStatus, string> = {
  EXPECTED: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  EARNED: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
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
  const { lang } = useDashboardI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedContent, setCopiedContent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingReferral, setAddingReferral] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("START_CONVERSATION");
  const [assistantSituation, setAssistantSituation] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [askingAssistant, setAskingAssistant] = useState(false);

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
      throw new Error(dashboardErrorMessage(payload.error, "تعذر تحميل لوحة السفير"));
    }
    setData(payload);
  }

  useEffect(() => {
    queueMicrotask(() => {
      setDarkMode(localStorage.getItem("cyberweel-ambassador-theme") === "dark");
      loadDashboard().catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل البيانات"));
    });
  }, []);

  const filteredReferrals = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.referrals.filter((referral) => {
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "FOLLOW_UP" && ["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE"].includes(referral.status))
        || referral.status === statusFilter;
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

  function openOverviewCard(section: "referrals" | "rewards", filter = "ALL") {
    if (section === "referrals") setStatusFilter(filter);
    navigate(section);
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

  async function copyValue(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedContent(key);
      window.setTimeout(() => setCopiedContent((current) => current === key ? null : current), 1800);
    } catch {
      setError("تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.");
    }
  }

  async function shareValue(input: { title: string; text: string; url?: string; fallbackKey: string }) {
    try {
      if (navigator.share) {
        await navigator.share({ title: input.title, text: input.text, url: input.url });
        return;
      }
      await copyValue([input.text, input.url].filter(Boolean).join("\n"), input.fallbackKey);
      setNotice("المشاركة غير متاحة في هذا المتصفح، لذلك تم نسخ المحتوى.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("تعذرت المشاركة الآن.");
    }
  }

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data?.isAdminPreview) {
      setError("المعاينة الإدارية للقراءة فقط.");
      return;
    }
    setAskingAssistant(true);
    setAssistantAnswer("");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/ambassador/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: assistantMode, situation: assistantSituation }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const messages: Record<string, string> = {
          AI_NOT_CONFIGURED: "مساعد السفير غير مهيأ بعد. أضف مفتاح Gemini في إعدادات البيئة.",
          AI_PROVIDER_ERROR: "تعذر الوصول إلى مساعد السفير الآن. حاول مجددًا لاحقًا.",
          AI_GUARDRAIL_FAILED: "امتنع المساعد عن تقديم رد قد يتضمن سعرًا أو موعدًا غير معتمد. حوّل الحالة إلى الإدارة.",
        };
        throw new Error(messages[payload?.error] || dashboardErrorMessage(payload?.error, "تعذر إنشاء الرد"));
      }
      setAssistantAnswer(String(payload.answer || ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء الرد");
    } finally {
      setAskingAssistant(false);
    }
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
      if (!response.ok) throw new Error(payload?.message || dashboardErrorMessage(payload?.error, "تعذر إضافة الإحالة"));
      setData((current) => current ? {
        ...current,
        referrals: [payload.referral, ...current.referrals],
        stats: {
          ...current.stats,
          referrals: current.stats.referrals + 1,
          followUp: current.stats.followUp + 1,
        },
      } : current);
      formElement.reset();
      setNotice(directReferralSuccess);
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
      if (!response.ok) throw new Error(dashboardErrorMessage(payload.error, "تعذر حفظ الملف"));
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

  const remainingRewardLabel = data.stats.rewardsByCurrency.length
    ? data.stats.rewardsByCurrency.map((item) => money(Number(item.expected) + Number(item.earned), item.currency)).join(" · ")
    : "0";
  const paidLabel = data.stats.rewardsByCurrency.length
    ? data.stats.rewardsByCurrency.map((item) => money(item.paid, item.currency)).join(" · ")
    : "0";
  const linkedRewardReferrals = data.referrals.filter((referral) => Boolean(referral.clientProject?.ambassadorRewardRate));
  const linkedRate = linkedRewardReferrals[0]?.clientProject?.ambassadorRewardRate;
  const levelRate = Number(data.stats.monthlyLevel.rate) > 0 ? data.stats.monthlyLevel.rate : data.stats.monthlyLevel.nextRate;
  const exampleRate = Number(linkedRate || levelRate || 10);
  const exampleReward = 1000 * exampleRate / 100;

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
          {(error || (notice && notice !== directReferralSuccess)) && <div className={`rounded-2xl border px-5 py-4 text-sm font-bold ${error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}>{error || notice}</div>}

          {activeSection === "overview" && <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[
              { label: "إجمالي الإحالات", value: data.stats.referrals, icon: UsersRound, section: "referrals" as const, filter: "ALL" },
              { label: "قيد المتابعة", value: data.stats.followUp, icon: Search, section: "referrals" as const, filter: "FOLLOW_UP" },
              { label: "تحولت إلى عملاء", value: data.stats.converted, icon: Check, section: "referrals" as const, filter: "CONVERTED" },
              { label: "المكافآت المتبقية", value: remainingRewardLabel, icon: BadgeDollarSign, section: "rewards" as const, filter: "ALL" },
              { label: "المكافآت المدفوعة", value: paidLabel, icon: WalletCards, section: "rewards" as const, filter: "ALL" },
            ].map((card) => { const Icon = card.icon; return <button key={card.label} type="button" onClick={() => openOverviewCard(card.section, card.filter)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-[#B89A5A] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89A5A] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:focus-visible:ring-offset-slate-950"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500 transition group-hover:text-[#9f7d3d] dark:text-slate-400">{card.label}</p><strong className="mt-3 block text-2xl font-black text-slate-950 dark:text-white">{card.value}</strong><span className="mt-2 block text-xs font-bold text-[#9f7d3d] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">عرض التفاصيل ←</span></div><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15 dark:text-[#d5b873]"><Icon size={22} /></span></div></button>; })}</section>

            <section className="rounded-3xl bg-[#101827] p-6 text-white shadow-xl sm:p-8"><div className="flex flex-col gap-6"><div><p className="text-sm font-black text-[#d5b873]">رابطك الموثق</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">شارك الفرصة وتابع النتيجة بشفافية</h2><p className="mt-3 max-w-3xl leading-8 text-white/65">العمولة لا تُسجل على الوعد، بل على إحالة موثقة ونتيجة فعلية تعتمدها الإدارة.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm text-white/55">رمز الإحالة</span><strong className="text-[#d5b873]">{data.ambassador.code}</strong></div><div className="flex flex-col gap-3 sm:flex-row"><input readOnly dir="ltr" value={data.ambassador.referralUrl} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left font-mono text-sm text-white outline-none" /><button type="button" onClick={copyReferralLink} className="flex items-center justify-center gap-2 rounded-xl bg-[#bd9850] px-5 py-3 font-black text-slate-950">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "تم النسخ" : "نسخ الرابط"}</button><button type="button" onClick={() => shareValue({ title: "CyberWeel", text: "شارك تحديك مع CyberWeel", url: data.ambassador.referralUrl, fallbackKey: "referral-share" })} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-black text-white"><Share2 size={18} />مشاركة</button></div></div><button type="button" onClick={() => navigate("tools")} className="w-fit font-black text-[#d5b873]">فتح كل أدوات السفير ←</button></div></section>

            <section><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-black text-[#9f7d3d]">آخر النشاط</p><h2 className="mt-1 text-2xl font-black">أحدث الإحالات</h2></div><button onClick={() => navigate("referrals")} className="font-black text-[#9f7d3d]">عرض الكل</button></div><div className="grid gap-3">{data.referrals.length ? data.referrals.slice(0, 5).map((referral) => <article key={referral.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900"><div><h3 className="font-black">{referral.name || "إحالة دون اسم"}</h3><p className="mt-1 text-sm text-slate-500">{referral.email || referral.phone || "لا توجد وسيلة تواصل"} · <DateText value={referral.createdAt} /></p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${referralStatusClass[referral.status] || referralStatusClass.NEW}`}>{referralStatus[referral.status] || dashboardLabel(referral.status, "حالة غير معروفة")}</span></article>) : <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">لا توجد إحالات بعد. ابدأ بالرابط أو أضف إحالة مباشرة.</div>}</div></section>
          </>}

          {activeSection === "tools" && <section className="space-y-7">
            <div><p className="text-sm font-black text-[#9f7d3d]">عدة عمل عملية</p><h2 className="mt-1 text-3xl font-black">أدوات السفير</h2><p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">شارك CyberWeel، سجّل الإحالات، واحصل على صياغة عملية للحديث مع العميل—من دون صلاحيات إدارية أو وعود غير معتمدة.</p></div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <article className="rounded-3xl bg-[#101827] p-6 text-white shadow-xl sm:p-8"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#bd9850] p-3 text-slate-950"><Link2 size={23} /></span><div><p className="text-sm font-black text-[#d5b873]">رابط الإحالة الشخصي</p><h3 className="text-2xl font-black">{data.ambassador.code}</h3></div></div><p className="mt-5 text-sm leading-7 text-white/65">يبقى تعريفك محفوظًا لمدة 30 يومًا في Cookie آمنة عند فتح الرابط، ثم تُربط الإحالة بك تلقائيًا عند إرسال الطلب.</p><input readOnly dir="ltr" value={data.ambassador.referralUrl} className="mt-5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left font-mono text-sm outline-none" /><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={copyReferralLink} className="flex items-center justify-center gap-2 rounded-xl bg-[#bd9850] px-5 py-3 font-black text-slate-950">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "تم النسخ" : "نسخ الرابط"}</button><button type="button" onClick={() => shareValue({ title: "CyberWeel", text: "شارك تحديك مع CyberWeel", url: data.ambassador.referralUrl, fallbackKey: "tool-referral-share" })} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-black"><Share2 size={18} />مشاركة</button></div></article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15"><QrCode size={23} /></span><div><p className="text-sm font-black text-[#9f7d3d]">QR Code</p><h3 className="text-xl font-black">{data.ambassador.name}</h3></div></div><img src={`/api/ambassador/qr${data.isAdminPreview ? `?adminPreview=${encodeURIComponent(data.ambassador.id)}` : ""}`} alt={`QR Code للسفير ${data.ambassador.name}`} width={320} height={320} className="mx-auto mt-5 aspect-square w-full max-w-[280px] rounded-2xl border border-[#D8D2C4] bg-white object-contain p-2" /><p dir="ltr" className="mt-3 truncate text-center text-xs text-slate-500">{data.ambassador.referralUrl}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><a href={`/api/ambassador/qr?download=1${data.isAdminPreview ? `&adminPreview=${encodeURIComponent(data.ambassador.id)}` : ""}`} download className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-black text-white dark:bg-[#bd9850] dark:text-slate-950"><Download size={18} />تحميل QR</a><button type="button" onClick={() => shareValue({ title: "CyberWeel QR", text: `CyberWeel — ${data.ambassador.name}`, url: data.ambassador.referralUrl, fallbackKey: "qr-share" })} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-black dark:border-slate-700"><Share2 size={18} />مشاركة</button></div></article>
            </div>

            <form onSubmit={addReferral} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15"><PlusCircle size={23} /></span><div><p className="text-sm font-black text-[#9f7d3d]">إضافة من تواصل مباشر</p><h3 className="text-2xl font-black">إحالة مباشرة</h3><p className="mt-1 text-sm text-slate-500">أرسل بيانات عميل محتمل تواصلت معه خارج رابط الإحالة. البريد الإلكتروني مطلوب لأنه قناة التواصل والتفعيل المعتمدة في CyberWeel.</p></div></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">اسم العميل<input required name="name" maxLength={120} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<input required name="email" type="email" maxLength={254} autoComplete="email" className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">وسيلة تواصل إضافية<input required name="contactMethod" maxLength={160} placeholder="رقم هاتف، واتساب، حساب تواصل..." className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">الشركة — اختياري<input name="company" maxLength={160} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">ماذا يحتاج العميل؟<textarea required name="needs" maxLength={2000} rows={4} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">ملاحظات — اختياري<textarea name="notes" maxLength={2000} rows={3} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label></div><button disabled={addingReferral} className="mt-5 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60 dark:bg-[#bd9850] dark:text-slate-950">{addingReferral ? "جارٍ الإرسال..." : "إرسال الإحالة للإدارة"}</button>{notice === directReferralSuccess && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}</form>

            <form onSubmit={askAssistant} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#101827] p-3 text-[#d5b873]"><Bot size={23} /></span><div><p className="text-sm font-black text-[#9f7d3d]">ذكاء اصطناعي عملي</p><h3 className="text-2xl font-black">مساعد السفير</h3></div></div><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">اكتب حالة العميل بلغته؛ سيجيبك المساعد باللغة نفسها. لا يعطي أسعارًا أو مواعيد أو وعودًا، ويحوّل التقدير إلى الإدارة.</p><div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]"><label className="grid gap-2 text-sm font-bold">نوع المساعدة<select value={assistantMode} onChange={(event) => setAssistantMode(event.target.value as AssistantMode)} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700">{assistantModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">حالة العميل<textarea required minLength={10} maxLength={2500} rows={5} value={assistantSituation} onChange={(event) => setAssistantSituation(event.target.value)} placeholder="مثال: لدي متجر ملابس ويريد زيادة المبيعات لكنه لا يعرف ماذا يحتاج." className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label></div><button disabled={askingAssistant || !assistantSituation.trim()} className="mt-5 flex items-center gap-2 rounded-xl bg-[#B89A5A] px-6 py-3 font-black text-[#111827] disabled:opacity-60"><Send size={18} />{askingAssistant ? "جارٍ تجهيز الرد..." : "اطلب المساعدة"}</button>{assistantAnswer && <div className="mt-6 rounded-2xl border border-[#D8D2C4] bg-[#F7F3EB] p-5 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"><p className="whitespace-pre-wrap leading-8">{assistantAnswer}</p><button type="button" onClick={() => copyValue(assistantAnswer, "assistant-answer")} className="mt-4 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-black text-white dark:bg-[#bd9850] dark:text-slate-950">{copiedContent === "assistant-answer" ? <Check size={17} /> : <Copy size={17} />}{copiedContent === "assistant-answer" ? "تم النسخ" : "نسخ الرد"}</button></div>}</form>

            <div><div className="mb-4 flex items-center gap-3"><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15"><BookOpenText size={23} /></span><div><p className="text-sm font-black text-[#9f7d3d]">جاهز للاستخدام</p><h3 className="text-2xl font-black">محتوى جاهز للمشاركة</h3></div></div><div className="grid gap-4 lg:grid-cols-2">{readyContent.map((item) => { const itemText = item.text[lang]; const itemTitle = item.title[lang]; return <article key={item.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h4 className="text-lg font-black">{itemTitle}</h4><p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{itemText}</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => copyValue(itemText, item.id)} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white dark:bg-[#bd9850] dark:text-slate-950">{copiedContent === item.id ? <Check size={17} /> : <Copy size={17} />}{copiedContent === item.id ? "تم النسخ" : "نسخ"}</button><button type="button" onClick={() => shareValue({ title: itemTitle, text: itemText, url: data.ambassador.referralUrl, fallbackKey: `share-${item.id}` })} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black dark:border-slate-700"><Share2 size={17} />مشاركة</button></div></article>; })}</div></div>
          </section>}

          {activeSection === "referrals" && <section className="space-y-7"><div><p className="text-sm font-black text-[#9f7d3d]">مسارك الخاص</p><h2 className="mt-1 text-3xl font-black">إحالاتي</h2><p className="mt-2 text-slate-600 dark:text-slate-300">ترى إحالاتك فقط؛ كل إحالة تبقى في حالتها الحقيقية حتى الاتفاق وبدء الأثر المالي، ولا تُسمى ناجحة قبل ذلك.</p></div>
            <form onSubmit={addReferral} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d] dark:bg-[#bd9850]/15"><PlusCircle size={23} /></span><div><h3 className="text-xl font-black">إحالة مباشرة</h3><p className="text-sm text-slate-500">أرسل بيانات عميل محتمل تعرفه مباشرة. البريد الإلكتروني مطلوب للتواصل والتفعيل، وستراجع الإدارة الإحالة قبل احتسابها.</p></div></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">اسم العميل<input required name="name" maxLength={120} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<input required name="email" type="email" maxLength={254} autoComplete="email" className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">وسيلة تواصل إضافية<input required name="contactMethod" maxLength={160} placeholder="رقم هاتف، واتساب، حساب تواصل..." className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">الشركة — اختياري<input name="company" maxLength={160} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">ماذا يحتاج العميل؟<textarea required name="needs" maxLength={2000} rows={4} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">ملاحظات — اختياري<textarea name="notes" maxLength={2000} rows={3} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label></div><button disabled={addingReferral} className="mt-5 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60 dark:bg-[#bd9850] dark:text-slate-950">{addingReferral ? "جارٍ الإرسال..." : "إرسال الإحالة للإدارة"}</button>{notice === directReferralSuccess && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}</form>

            <div className="flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالاسم أو وسيلة التواصل" className="w-full bg-transparent outline-none" /></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><Filter size={18} className="text-slate-400" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-transparent font-bold outline-none"><option value="ALL">كل الحالات</option><option value="FOLLOW_UP">قيد المتابعة</option>{Object.entries(referralStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-right"><thead className="bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-5 py-4">العميل</th><th className="px-5 py-4">التواصل</th><th className="px-5 py-4">حالة الإحالة</th><th className="px-5 py-4">حالة المكافأة</th><th className="px-5 py-4">المكافأة</th><th className="px-5 py-4">تاريخ الإحالة</th><th className="px-5 py-4">آخر تحديث</th></tr></thead><tbody>{filteredReferrals.map((referral) => <tr key={referral.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-black">{referral.name || "دون اسم"}</td><td className="px-5 py-4 text-sm text-slate-500"><div>{referral.email || referral.phone || "—"}</div>{referral.contactMethod && <div className="mt-1 text-xs">{referral.contactMethod}</div>}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${referralStatusClass[referral.status] || referralStatusClass.NEW}`}>{referralStatus[referral.status] || dashboardLabel(referral.status, "حالة غير معروفة")}</span></td><td className="px-5 py-4">{referral.clientProject?.ambassadorRewardRate ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">النسبة مثبتة</span> : <span className={`rounded-full px-3 py-1 text-xs font-black ${commissionStatusClass[referral.commissionStatus]}`}>{commissionStatus[referral.commissionStatus]}</span>}</td><td className="px-5 py-4 text-sm">{referral.clientProject?.ambassadorRewardRate ? <div><strong className="text-emerald-700 dark:text-emerald-300">{referral.clientProject.ambassadorRewardRate}%</strong><span className="mt-1 block text-xs text-slate-500">تتحول إلى مدفوعة مع اكتمال شروط المرحلة وتسجيل الدفع</span></div> : referral.commissionAmount ? money(referral.commissionAmount, referral.commissionCurrency) : "لم تُحدد"}</td><td className="px-5 py-4 text-sm text-slate-500"><DateText value={referral.createdAt} /></td><td className="px-5 py-4 text-sm text-slate-500"><DateText value={referral.updatedAt} /></td></tr>)}</tbody></table>{!filteredReferrals.length && <div className="p-10 text-center text-slate-500">لا توجد نتائج مطابقة.</div>}</div></div>
          </section>}

          {activeSection === "rewards" && <section className="space-y-7"><div><p className="text-sm font-black text-[#9f7d3d]">وضوح من الإحالة حتى الدفع</p><h2 className="mt-1 text-3xl font-black">مكافآتي</h2><p className="mt-2 text-slate-600 dark:text-slate-300">مكافأتك الكاملة تظهر كرصيد متوقع من المشروع، وتتحول أجزاؤها إلى مدفوعة مع اكتمال شروط المراحل وتسجيل الدفع.</p></div>
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm leading-7 text-rose-900 shadow-sm dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-100"><strong className="block text-base font-black text-rose-700 dark:text-rose-300">قاعدة الدفع</strong><span className="mt-1 block">لا تُعد الإحالة ناجحة ماليًا لمجرد التواصل أو إنشاء المشروع. تبدأ صفة النجاح المالي عند استلام CyberWeel أول دفعة مؤهلة من العميل بعد اكتمال المرحلة واعتمادها، ثم تُسجّل المكافأة كمدفوعة بعد تنفيذ دفعها للسفير وإثبات العملية.</span></div>
            <div className="rounded-3xl bg-[#101827] p-6 text-white shadow-xl sm:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-sm font-black text-[#d5b873]">مستواك هذا الشهر</p><h3 className="mt-2 text-3xl font-black">{data.stats.monthlyLevel.name}</h3><p className="mt-2 text-white/65">الإحالات الناجحة ماليًا: {data.stats.monthlyLevel.successfulReferrals} · النسبة الحالية: {data.stats.monthlyLevel.rate}%</p></div><div className="min-w-[260px]"><div className="mb-2 flex justify-between text-sm"><span>{data.stats.monthlyLevel.successfulReferrals} من {data.stats.monthlyLevel.nextTarget || data.stats.monthlyLevel.successfulReferrals}</span><span>{data.stats.monthlyLevel.nextRate ? `${data.stats.monthlyLevel.nextRate}%` : "أعلى مستوى"}</span></div><div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#bd9850]" style={{ width: `${data.stats.monthlyLevel.nextTarget ? Math.min(100, data.stats.monthlyLevel.successfulReferrals / data.stats.monthlyLevel.nextTarget * 100) : 100}%` }} /></div><p className="mt-3 text-sm text-white/65">{data.stats.monthlyLevel.nextRate ? `بقيت ${data.stats.monthlyLevel.remaining} إحالات ناجحة ماليًا للوصول إلى نسبة ${data.stats.monthlyLevel.nextRate}% هذا الشهر.` : "أنت في أعلى مستوى لهذا الشهر."}</p></div></div></div>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div><p className="text-sm font-black text-[#9f7d3d]">سلم المكافآت</p><h3 className="mt-1 text-2xl font-black">اعرف طريقك للمستوى التالي</h3><p className="mt-2 text-sm text-slate-500">يُحسب المستوى من الإحالات التي بدأت أثرًا ماليًا فعليًا بعد استلام دفعة عميل مؤهلة خلال الشهر.</p></div><div className="mt-5 grid gap-4 md:grid-cols-3">{data.stats.rewardLevels.map((level) => { const current = level.name === data.stats.monthlyLevel.name && level.rate === data.stats.monthlyLevel.rate; return <article key={level.id} className={`rounded-2xl border p-5 ${current ? "border-[#B89A5A] bg-[#F7F3EB] ring-2 ring-[#B89A5A]/20 dark:bg-[#B89A5A]/10" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#9f7d3d]">{current ? "مستواك الحالي" : `من ${level.minSuccessfulReferrals} إحالة ناجحة`}</p><h4 className="mt-1 text-xl font-black">{level.name}</h4></div><strong className="text-3xl font-black text-[#9f7d3d]">{level.rate}%</strong></div><p className="mt-3 text-sm text-slate-500">{level.minSuccessfulReferrals === 1 ? "يبدأ بعد أول إحالة ناجحة ماليًا." : `يبدأ عند الوصول إلى ${level.minSuccessfulReferrals} إحالات ناجحة ماليًا خلال الشهر.`}</p></article>; })}</div></section>
            {linkedRewardReferrals.length > 0 && <div className="grid gap-4 md:grid-cols-2">{linkedRewardReferrals.map((referral) => <article key={referral.id} className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black text-emerald-700 dark:text-emerald-300">نسبة محفوظة للمشروع</p><h3 className="mt-1 text-xl font-black">{referral.clientProject!.title}</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">العميل: {referral.name || referral.email || "—"}</p></div><span className="rounded-full bg-emerald-600 px-4 py-2 font-black text-white">{referral.clientProject!.ambassadorRewardRate}%</span></div><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">النسبة محفوظة لهذا المشروع. تظهر مكافأتك الكاملة ضمن الرصيد المتوقع، ثم تتحول أجزاؤها إلى مدفوعة مع اكتمال مراحل المشروع ودفع العميل واعتماد المرحلة وتنفيذ الدفع لك.</p></article>)}</div>}
            <div className="grid gap-4 md:grid-cols-2">{data.stats.rewardsByCurrency.map((summary) => <article key={summary.currency} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between"><h3 className="text-2xl font-black">{summary.currency}</h3><CircleDollarSign className="text-[#9f7d3d]" /></div><div className="mt-5 grid grid-cols-3 gap-4"><div><span className="text-xs text-slate-500">إجمالي المكافأة</span><strong className="mt-1 block">{money(summary.total, summary.currency)}</strong></div><div><span className="text-xs text-slate-500">متبقية متوقعة</span><strong className="mt-1 block">{money(Number(summary.expected) + Number(summary.earned), summary.currency)}</strong></div><div><span className="text-xs text-slate-500">مدفوعة</span><strong className="mt-1 block">{money(summary.paid, summary.currency)}</strong></div></div></article>)}</div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-right"><thead className="bg-slate-50 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-5 py-4">العميل</th><th className="px-5 py-4">المشروع</th><th className="px-5 py-4">المرحلة</th><th className="px-5 py-4">قيمة المرحلة</th><th className="px-5 py-4">النسبة</th><th className="px-5 py-4">المكافأة</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">الدفع</th></tr></thead><tbody>{data.rewards.map((reward) => <tr key={reward.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-5 py-4 font-black">{reward.project.client.name || reward.project.client.email}</td><td className="px-5 py-4">{reward.project.title}</td><td className="px-5 py-4">{reward.projectStage.name}</td><td className="px-5 py-4">{money(reward.baseAmount, reward.currency)}</td><td className="px-5 py-4">{reward.rate}%</td><td className="px-5 py-4 font-black">{money(reward.amount, reward.currency)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${rewardStatusClass[reward.status]}`}>{rewardStatus[reward.status]}</span></td><td className="px-5 py-4 text-sm text-slate-500">{reward.paymentProof ? <div className="space-y-1"><span className="block font-bold text-emerald-700 dark:text-emerald-300">دُفعت <DateText value={reward.paymentProof.paidAt} /></span><span className="block">الطريقة: {reward.paymentProof.method}</span><span dir="ltr" className="block text-right [unicode-bidi:isolate]">المرجع: {reward.paymentProof.reference}</span>{reward.paymentProof.note && <span className="block">ملاحظة: {reward.paymentProof.note}</span>}</div> : reward.paidAt ? <>دُفعت <DateText value={reward.paidAt} /></> : "—"}</td></tr>)}</tbody></table>{!data.rewards.length && <p className="p-10 text-center text-slate-500">{linkedRewardReferrals.length ? "نسبة المشروع محفوظة أعلاه. ستظهر قيمة المكافأة مع مراحل المشروع، وتتحول إلى مدفوعة بعد اكتمال الشروط وتنفيذ الدفع." : "ستظهر مكافآتك هنا عند إنشاء مراحل مالية لمشاريع إحالاتك."}</p>}</div></div>
            <div className="grid gap-5 lg:grid-cols-2"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-xl font-black">كيف تعمل المكافآت؟</h3><ol className="mt-5 grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><li>1- أحِل العميل إلى CyberWeel.</li><li>2- تتابع الإدارة التواصل والتفاوض حتى الاتفاق النهائي.</li><li>3- عند بدء المشروع تُثبت نسبة مكافأتك للمشروع.</li><li>4- تظهر مكافأتك الكاملة ضمن الرصيد المتوقع للمشروع.</li><li>5- تُتابع المراحل ودفعات العميل واعتماد التنفيذ داخل CyberWeel.</li><li>6- بعد دفع الجزء المقابل لك وتسجيل إثبات العملية يتحول من متوقع إلى مدفوع.</li></ol><div className="mt-5 rounded-2xl bg-[#F7F3EB] p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">مثال توضيحي: إذا كانت قيمة المرحلة 1,000$ ونسبتك {exampleRate}%، يكون الجزء المقابل من مكافأتك {exampleReward.toLocaleString("en-US")}$ ضمن الرصيد المتوقع إلى أن يتم دفعه لك.</div></article><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><h3 className="text-xl font-black">طريقة استلام المكافأة</h3><p className="mt-4 text-slate-500">{data.ambassador.payoutMethod || "لم تسجل طريقة استلام بعد"}</p>{data.ambassador.payoutDetails && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">{data.ambassador.payoutDetails}</p>}<button onClick={() => navigate("profile")} className="mt-5 rounded-xl bg-[#B89A5A] px-5 py-3 font-black text-[#111827]">تعديل طريقة الاستلام</button></article></div>
          </section>}

          {activeSection === "profile" && <section className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-black text-[#9f7d3d]">بياناتك المالية والتواصلية</p><h2 className="mt-1 text-3xl font-black">الملف الشخصي</h2><p className="mt-2 text-slate-600 dark:text-slate-300">حدّث بيانات التواصل وطريقة استلام المكافآت من مكان واحد.</p></div><form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">رقم التواصل<input required name="phone" maxLength={40} defaultValue={data.ambassador.phone || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">البلد<input required name="country" maxLength={100} defaultValue={data.ambassador.country || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">طريقة التواصل المفضلة<input required name="contactMethod" maxLength={100} defaultValue={data.ambassador.contactMethod || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">طريقة استلام المكافأة<select required name="payoutMethod" defaultValue={data.ambassador.payoutMethod || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700"><option value="" disabled>اختر طريقة الاستلام</option><option value="شام كاش">شام كاش</option><option value="حوالة مالية">حوالة مالية</option><option value="تحويل بنكي">تحويل بنكي</option><option value="أخرى">أخرى</option></select></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">بيانات الاستلام<textarea required name="payoutDetails" maxLength={2000} rows={4} defaultValue={data.ambassador.payoutDetails || ""} className="rounded-xl border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-[#bd9850] dark:border-slate-700" /></label></div><button disabled={savingProfile} className="mt-5 rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60 dark:bg-[#bd9850] dark:text-slate-950">{savingProfile ? "جارٍ الحفظ..." : "حفظ البيانات"}</button></form><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">البريد الإلكتروني</dt><dd className="mt-1 break-all font-black">{data.ambassador.email}</dd></div><div><dt className="text-sm text-slate-500">سفير منذ</dt><dd className="mt-1 font-black"><DateText value={data.ambassador.joinedAt} /></dd></div></dl><Link href="/partner/forgot-password" className="mt-5 inline-flex items-center gap-2 font-black text-[#9f7d3d]">تغيير كلمة المرور <ArrowLeft size={17} /></Link></div></section>}
        </div>
      </main>
    </div>
  );
}
