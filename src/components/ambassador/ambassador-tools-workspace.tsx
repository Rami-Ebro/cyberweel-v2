"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeDollarSign, CheckCircle2, Copy, Link2, MessageCircle, PlusCircle, Sparkles, Target, UsersRound } from "lucide-react";

type Referral = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  followUpEligible?: boolean;
  createdAt: string;
};

type DashboardPayload = {
  ambassador: { id: string; name: string; referralUrl: string };
  isAdminPreview: boolean;
  stats: {
    followUp: number;
    converted: number;
    rewardsByCurrency: Array<{ currency: string; expected: string; earned: string; paid: string }>;
  };
  referrals: Referral[];
};

function daysSince(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ar", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function findToolsSection() {
  return Array.from(document.querySelectorAll<HTMLElement>("main section")).find((section) =>
    Array.from(section.querySelectorAll("h2")).some((heading) => heading.textContent?.trim() === "أدوات السفير"),
  ) || null;
}

function findBlock(text: string) {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("main article, main form, main div"));
  return candidates.find((element) => element.textContent?.includes(text)) || null;
}

function scrollToTool(text: string) {
  const target = findBlock(text);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openDashboardSection(index: number) {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("aside nav button"));
  buttons[index]?.click();
}

export function AmbassadorToolsWorkspace() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let currentMount: HTMLDivElement | null = null;

    const attach = () => {
      const section = findToolsSection();
      if (!section) {
        setTarget(null);
        return;
      }

      let host = section.querySelector<HTMLDivElement>("[data-ambassador-work-center]");
      if (!host) {
        host = document.createElement("div");
        host.dataset.ambassadorWorkCenter = "true";
        const intro = section.firstElementChild;
        if (intro?.nextSibling) section.insertBefore(host, intro.nextSibling);
        else section.appendChild(host);
      }
      currentMount = host;
      setMount(host);
      setTarget(section);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (currentMount?.isConnected) currentMount.remove();
    };
  }, []);

  useEffect(() => {
    if (!target) return;
    const previewId = new URLSearchParams(window.location.search).get("adminPreview");
    const endpoint = previewId
      ? `/api/ambassador/dashboard?adminPreview=${encodeURIComponent(previewId)}`
      : "/api/ambassador/dashboard";
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((payload) => { if (payload) setData(payload); })
      .catch((error) => { if (!(error instanceof DOMException && error.name === "AbortError")) setData(null); });
    return () => controller.abort();
  }, [target]);

  const followUps = useMemo(() => {
    if (!data) return [];
    return data.referrals
      .filter((item) => item.followUpEligible ?? ["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE"].includes(item.status))
      .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt));
  }, [data]);

  const rewards = data?.stats.rewardsByCurrency.map((item) => ({
    currency: item.currency,
    amount: Number(item.expected || 0) + Number(item.earned || 0),
  })) ?? [];

  async function copyReferralLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.ambassador.referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // The original referral-link card remains directly below as a manual fallback.
    }
  }

  if (!mount) return null;

  return createPortal(
    <div dir="rtl" className="space-y-4 pb-1">
      <section className="overflow-hidden rounded-3xl border border-[#D8D2C4] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="bg-[#111827] px-5 py-5 text-white sm:px-6">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-[#B89A5A] p-3 text-[#111827]"><Target size={22} /></span>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wide text-[#D8B86A]">مركز الأعمال</p>
              <h3 className="mt-1 text-xl font-black sm:text-2xl">ماذا تحتاج أن تفعل الآن؟</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">ابدأ بالمتابعة، ثم اجلب فرصة جديدة، واستخدم مساعد CyberWeel عندما تحتاج صياغة أو ردًا.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          <button type="button" onClick={() => scrollToTool("إحالة مباشرة")} className="min-h-20 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><PlusCircle size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">جلب عميل جديد</strong></button>
          <button type="button" onClick={() => scrollToTool("مساعد السفير")} className="min-h-20 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><Sparkles size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">مساعد CyberWeel</strong></button>
          <button type="button" onClick={() => scrollToTool("محتوى جاهز للمشاركة")} className="min-h-20 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><MessageCircle size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">المحتوى الجاهز</strong></button>
          <button type="button" onClick={() => openDashboardSection(2)} className="min-h-20 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><UsersRound size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">إحالاتي</strong></button>
        </div>
      </section>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => openDashboardSection(2)} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3"><span className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40"><Target size={18} /></span><strong className="text-2xl font-black">{data.stats.followUp}</strong></div>
            <p className="mt-3 text-sm font-black">تحتاج متابعة</p>
            <p className="mt-1 text-xs text-slate-500">ابدأ بها قبل البحث عن إحالات جديدة.</p>
          </button>
          <button type="button" onClick={() => openDashboardSection(2)} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40"><CheckCircle2 size={18} /></span><strong className="text-2xl font-black">{data.stats.converted}</strong></div>
            <p className="mt-3 text-sm font-black">تحولت إلى عملاء</p>
            <p className="mt-1 text-xs text-slate-500">نتائج فعلية من إحالاتك.</p>
          </button>
          <button type="button" onClick={() => openDashboardSection(3)} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-[#f3ead7] p-2 text-[#9f7d3d] dark:bg-[#bd9850]/15"><BadgeDollarSign size={18} /></span><div className="text-left">{rewards.length ? rewards.map((item) => <strong key={item.currency} className="block text-sm font-black">{money(item.amount, item.currency)}</strong>) : <strong className="text-2xl font-black">0</strong>}</div></div>
            <p className="mt-3 text-sm font-black">مكافآت غير مدفوعة</p>
            <p className="mt-1 text-xs text-slate-500">كل عملة معروضة بشكل مستقل.</p>
          </button>
        </div>
      )}

      {data && followUps.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-[#9f7d3d]">أولوية اليوم</p><h3 className="mt-1 text-lg font-black">ابدأ بهذه الإحالة</h3></div><button type="button" onClick={() => openDashboardSection(2)} className="text-sm font-black text-[#9f7d3d]">عرض إحالاتي</button></div>
          <div className="mt-3 rounded-2xl bg-[#F7F3EB] p-4 dark:bg-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{followUps[0].name || "إحالة دون اسم"}</strong><p className="mt-1 text-xs text-slate-500">{followUps[0].email || followUps[0].phone || "لا توجد وسيلة تواصل"} · منذ {daysSince(followUps[0].createdAt)} يوم</p></div><button type="button" onClick={() => { scrollToTool("مساعد السفير"); }} className="rounded-xl bg-[#111827] px-4 py-3 text-sm font-black text-white">جهّز رسالة متابعة</button></div>
          </div>
        </section>
      )}

      {data && (
        <section className="rounded-2xl border border-[#D8D2C4] bg-[#FFFDF8] p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3"><Link2 size={18} className="shrink-0 text-[#9f7d3d]" /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-500">رابطك الشخصي</p><p dir="ltr" className="mt-1 truncate text-left text-xs">{data.ambassador.referralUrl}</p></div><button type="button" onClick={copyReferralLink} className="shrink-0 rounded-xl bg-[#B89A5A] px-3 py-2 text-xs font-black text-[#111827]"><Copy size={15} className="inline" /> {copied ? "تم" : "نسخ"}</button></div>
        </section>
      )}
    </div>,
    mount,
  );
}
