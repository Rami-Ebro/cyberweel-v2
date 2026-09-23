"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeDollarSign, CheckCircle2, Copy, MessageCircle, Sparkles, Target, UserPlus, UsersRound } from "lucide-react";

type Referral = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
};

type DashboardData = {
  ambassador: { id?: string; name: string; code: string; referralUrl: string };
  isAdminPreview: boolean;
  stats: {
    referrals: number;
    followUp: number;
    converted: number;
    rewardsByCurrency: Array<{ currency: string; expected: string; earned: string; paid: string }>;
  };
  referrals: Referral[];
};

const FOLLOW_UP = new Set(["NEW", "CONTACTED", "INTERESTED", "AWAITING_RESPONSE"]);

function daysSince(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("ar", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function AmbassadorActionCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    const currentPreviewId = new URLSearchParams(window.location.search).get("adminPreview");
    setPreviewId(currentPreviewId);
    const endpoint = currentPreviewId
      ? `/api/ambassador/dashboard?adminPreview=${encodeURIComponent(currentPreviewId)}`
      : "/api/ambassador/dashboard";

    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          if (typeof payload?.redirectTo === "string" && payload.redirectTo) {
            window.location.assign(payload.redirectTo);
            return null;
          }
          throw new Error(payload?.error || "تعذر تحميل مركز العمل");
        }
        return payload as DashboardData;
      })
      .then((payload) => {
        if (payload) setData(payload);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل مركز العمل"));
  }, []);

  const followUps = useMemo(() => {
    if (!data) return [];
    return data.referrals
      .filter((item) => FOLLOW_UP.has(item.status))
      .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt));
  }, [data]);

  const stale = followUps.filter((item) => daysSince(item.createdAt) >= 3);
  const rewardLabels = data?.stats.rewardsByCurrency.map((item) => {
    const remaining = Number(item.expected || 0) + Number(item.earned || 0);
    return money(Number.isFinite(remaining) ? remaining : 0, item.currency);
  }) ?? [];
  const dashboardHref = previewId
    ? `/ambassador/dashboard?adminPreview=${encodeURIComponent(previewId)}`
    : "/ambassador/dashboard";

  async function copyReferralLink() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.ambassador.referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("تعذر نسخ الرابط تلقائيًا.");
    }
  }

  if (error) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#F7F3EB] p-6"><div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-black">تعذر تحميل مركز العمل</h1><p className="mt-3 text-slate-600">{error}</p><Link href={dashboardHref} className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-black text-white">العودة إلى اللوحة</Link></div></main>;
  }

  if (!data) return <main className="grid min-h-screen place-items-center bg-[#F7F3EB]"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#B89A5A] border-t-transparent" /></main>;

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-6 text-slate-950 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-[#111827] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-black text-[#D8B86A]">AMBASSADOR WORKSPACE V2</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">ماذا سننجز اليوم، {data.ambassador.name}؟</h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/65">بدل مراقبة الأرقام فقط، ابدأ من الخطوة التي تقرّب الإحالة من نتيجة فعلية.</p>
          </div>
          <Link href={dashboardHref} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 font-black text-white"><ArrowLeft size={18} />اللوحة الحالية</Link>
        </header>

        {data.isAdminPreview && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-bold text-amber-800">معاينة الإدارة — مركز العمل للقراءة فقط.</div>}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Target /></span><strong className="text-3xl font-black">{data.stats.followUp}</strong></div><h2 className="mt-5 text-lg font-black">إحالات تحتاج متابعة</h2><p className="mt-2 text-sm leading-6 text-slate-500">هذه هي الأولوية قبل البحث عن أرقام جديدة.</p></article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 /></span><strong className="text-3xl font-black">{data.stats.converted}</strong></div><h2 className="mt-5 text-lg font-black">تحولت إلى عملاء</h2><p className="mt-2 text-sm leading-6 text-slate-500">نتيجة فعلية وليست مجرد نشاط.</p></article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><span className="rounded-2xl bg-[#f3ead7] p-3 text-[#9f7d3d]"><BadgeDollarSign /></span><div className="text-left">{rewardLabels.length ? rewardLabels.map((label) => <strong key={label} className="block text-xl font-black">{label}</strong>) : <strong className="text-3xl font-black">0</strong>}</div></div><h2 className="mt-5 text-lg font-black">مكافآت غير مدفوعة</h2><p className="mt-2 text-sm leading-6 text-slate-500">المتوقع والمستحق مع إبقاء كل عملة منفصلة.</p></article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-black text-[#9f7d3d]">أولوية اليوم</p><h2 className="mt-1 text-2xl font-black">من يحتاج منك خطوة الآن؟</h2></div><span className="text-sm font-bold text-slate-500">{stale.length ? `${stale.length} متابعة متأخرة` : "لا توجد متابعة متأخرة"}</span></div>
            <div className="mt-5 space-y-3">
              {followUps.slice(0, 5).map((referral) => (
                <article key={referral.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center">
                  <div><h3 className="font-black">{referral.name || "إحالة دون اسم"}</h3><p className="mt-1 text-sm text-slate-500">{referral.email || referral.phone || "لا توجد وسيلة تواصل"} · منذ {daysSince(referral.createdAt)} يوم</p></div>
                  <Link href={dashboardHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"><MessageCircle size={17} />متابعة الإحالة</Link>
                </article>
              ))}
              {!followUps.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-600" /><h3 className="mt-3 font-black">لا توجد إحالات معلّقة الآن</h3><p className="mt-2 text-sm text-slate-500">وقت ممتاز للبحث عن فرصة جديدة بدل مطاردة عميل غير موجود 😄</p></div>}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-[#111827] p-6 text-white shadow-xl"><Sparkles className="text-[#D8B86A]" /><h2 className="mt-4 text-2xl font-black">خطوتك التالية</h2><p className="mt-3 leading-7 text-white/65">{followUps.length ? "ابدأ بأقدم إحالة تحتاج متابعة، ثم انتقل لجلب فرصة جديدة." : "لا توجد متابعة معلقة. استخدم أدوات السفير لجلب إحالة جديدة."}</p><Link href={dashboardHref} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B89A5A] px-4 py-3 font-black text-slate-950"><Sparkles size={18} />فتح مساعد السفير</Link></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">رابطك الشخصي</h2><p dir="ltr" className="mt-3 truncate rounded-xl bg-slate-50 px-3 py-3 text-left text-xs text-slate-600">{data.ambassador.referralUrl}</p><button type="button" onClick={copyReferralLink} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-black"><Copy size={18} />{copied ? "تم النسخ" : "نسخ الرابط"}</button></div>
          </aside>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Link href={dashboardHref} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"><UserPlus className="text-[#9f7d3d]" /><h3 className="mt-4 text-lg font-black">أضف إحالة</h3><p className="mt-2 text-sm text-slate-500">سجّل عميلًا محتملًا مباشرة.</p></Link>
          <Link href={dashboardHref} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"><Sparkles className="text-[#9f7d3d]" /><h3 className="mt-4 text-lg font-black">جهّز رسالة</h3><p className="mt-2 text-sm text-slate-500">استخدم مساعد Gemini الحالي بصلاحياته الآمنة.</p></Link>
          <Link href={dashboardHref} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5"><UsersRound className="text-[#9f7d3d]" /><h3 className="mt-4 text-lg font-black">راجع كل الإحالات</h3><p className="mt-2 text-sm text-slate-500">شاهد الحالة والنتائج من المصدر الحالي.</p></Link>
        </section>
      </div>
    </main>
  );
}
