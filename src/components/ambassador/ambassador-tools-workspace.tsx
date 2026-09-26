"use client";

import { useMemo } from "react";
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

export type AmbassadorToolId = "ambassador-new-referral" | "ambassador-assistant" | "ambassador-ready-content";

type WorkspaceProps = {
  data: DashboardPayload;
  copied: boolean;
  onCopyReferralLink: () => void;
  onOpenTool: (id: AmbassadorToolId) => void;
  onNavigate: (section: "referrals" | "rewards") => void;
};

export function AmbassadorToolsWorkspace({ data, copied, onCopyReferralLink, onOpenTool, onNavigate }: WorkspaceProps) {
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

  return (
    <div data-ambassador-work-center className="min-w-0 space-y-4 pb-1">
      <section className="overflow-hidden rounded-3xl border border-[#D8D2C4] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="bg-[#111827] px-5 py-5 text-white sm:px-6">
          <div className="flex items-start gap-3">
            <span className="shrink-0 rounded-2xl bg-[#B89A5A] p-3 text-[#111827]"><Target size={22} /></span>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wide text-[#D8B86A]">مركز الأعمال</p>
              <h3 className="mt-1 text-xl font-black sm:text-2xl">ماذا تحتاج أن تفعل الآن؟</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">ابدأ بالمتابعة، ثم اجلب فرصة جديدة، واستعن بمساعدك الذكي من سايبرويل عندما تحتاج صياغة أو ردًا.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          <button type="button" onClick={() => onOpenTool("ambassador-new-referral")} className="min-h-20 min-w-0 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><PlusCircle size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">جلب عميل جديد</strong></button>
          <button type="button" onClick={() => onOpenTool("ambassador-assistant")} className="min-h-20 min-w-0 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><Sparkles size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">مساعدك الذكي من سايبرويل</strong></button>
          <button type="button" onClick={() => onOpenTool("ambassador-ready-content")} className="min-h-20 min-w-0 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><MessageCircle size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">المحتوى الجاهز</strong></button>
          <button type="button" onClick={() => onNavigate("referrals")} className="min-h-20 min-w-0 rounded-2xl border border-slate-200 p-3 text-right transition hover:border-[#B89A5A] dark:border-slate-700"><UsersRound size={20} className="text-[#9f7d3d]" /><strong className="mt-2 block text-sm">إحالاتي</strong></button>
        </div>
      </section>

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => onNavigate("referrals")} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3"><span className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40"><Target size={18} /></span><strong className="text-2xl font-black">{data.stats.followUp}</strong></div>
            <p className="mt-3 text-sm font-black">تحتاج متابعة</p>
            <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">ابدأ بها قبل البحث عن إحالات جديدة.</p>
          </button>
          <button type="button" onClick={() => onNavigate("referrals")} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40"><CheckCircle2 size={18} /></span><strong className="text-2xl font-black">{data.stats.converted}</strong></div>
            <p className="mt-3 text-sm font-black">تحولت إلى عملاء</p>
            <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">نتائج فعلية من إحالاتك.</p>
          </button>
          <button type="button" onClick={() => onNavigate("rewards")} className="rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-[#f3ead7] p-2 text-[#9f7d3d] dark:bg-[#bd9850]/15"><BadgeDollarSign size={18} /></span><div className="min-w-0 text-left [overflow-wrap:anywhere]">{rewards.length ? rewards.map((item) => <strong key={item.currency} className="block text-sm font-black">{money(item.amount, item.currency)}</strong>) : <strong className="text-2xl font-black">0</strong>}</div></div>
            <p className="mt-3 text-sm font-black">مكافآت غير مدفوعة</p>
            <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">كل عملة معروضة بشكل مستقل.</p>
          </button>
        </div>
      )}

      {data && followUps.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-[#9f7d3d]">أولوية اليوم</p><h3 className="mt-1 text-lg font-black">ابدأ بهذه الإحالة</h3></div><button type="button" onClick={() => onNavigate("referrals")} className="text-sm font-black text-[#9f7d3d]">عرض إحالاتي</button></div>
          <div className="mt-3 rounded-2xl bg-[#F7F3EB] p-4 dark:bg-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{followUps[0].name || "إحالة دون اسم"}</strong><p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">{followUps[0].email || followUps[0].phone || "لا توجد وسيلة تواصل"} · منذ {daysSince(followUps[0].createdAt)} يوم</p></div><button type="button" onClick={() => { onOpenTool("ambassador-assistant"); }} className="rounded-xl bg-[#111827] px-4 py-3 text-sm font-black text-white">جهّز رسالة متابعة</button></div>
          </div>
        </section>
      )}

      {data && (
        <section className="rounded-2xl border border-[#D8D2C4] bg-[#FFFDF8] p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3"><Link2 size={18} className="shrink-0 text-[#9f7d3d]" /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-500">رابطك الشخصي</p><p dir="ltr" className="mt-1 truncate text-left text-xs">{data.ambassador.referralUrl}</p></div><button type="button" onClick={onCopyReferralLink} className="min-h-11 shrink-0 rounded-xl bg-[#B89A5A] px-3 py-2 text-xs font-black text-[#111827]"><Copy size={15} className="inline" /> {copied ? "تم" : "نسخ"}</button></div>
        </section>
      )}
    </div>
  );
}
