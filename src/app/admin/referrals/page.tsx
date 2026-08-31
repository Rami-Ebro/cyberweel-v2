"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { BadgeCheck, ChevronDown, CircleDollarSign, Clock3, MessageSquareText, UserRound } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateText } from "@/components/ui/date-text";
import { DateInput } from "@/components/ui/date-input";
import { dashboardErrorMessage } from "@/lib/dashboard-labels";

type ReferralStatus = "NEW" | "CONTACTED" | "INTERESTED" | "AWAITING_RESPONSE" | "NOT_INTERESTED" | "CONVERTED";
type ReferralDecision = "PENDING_REVIEW" | "ACCEPTED" | "REJECTED" | "CONVERTED_TO_CLIENT" | "CANCELLED";
type CommissionStatus = "VERIFYING" | "ON_HOLD" | "NOT_ELIGIBLE" | "DUE" | "PAID";
type CommissionType = "FIXED" | "PERCENTAGE";
type Owner = { user: { name: string | null; email: string } };
type Referral = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  source: string | null;
  sourcePath: string | null;
  contactMethod: string | null;
  notes: string | null;
  adminDecision: ReferralDecision | null;
  adminNotes: string | null;
  commissionType: CommissionType | null;
  commissionAmount: string | null;
  commissionRate: string | null;
  commissionBaseAmount: string | null;
  commissionCurrency: string;
  commissionStatus: CommissionStatus;
  ambassador: Owner | null;
  partner: Owner | null;
  updatedBy: { name: string | null; email: string } | null;
  convertedClient: { id: string; name: string | null; email: string } | null;
  clientProject: { id: string; title: string; currency: string; paidAmount: number; hasPaidInvoice: boolean } | null;
};
type AmbassadorOption = { id: string; user: { name: string | null; email: string } };

const referralLabels: Record<ReferralStatus, string> = {
  NEW: "جديدة",
  CONTACTED: "تم التواصل",
  INTERESTED: "مهتم",
  AWAITING_RESPONSE: "بانتظار الرد",
  NOT_INTERESTED: "غير مهتم",
  CONVERTED: "تحولت إلى عميل",
};
const decisionLabels: Record<ReferralDecision, string> = {
  PENDING_REVIEW: "قيد المراجعة",
  ACCEPTED: "مقبولة",
  REJECTED: "مرفوضة",
  CONVERTED_TO_CLIENT: "تحولت إلى عميل",
  CANCELLED: "ملغاة",
};
const commissionLabels: Record<CommissionStatus, string> = {
  VERIFYING: "قيد التحقق",
  ON_HOLD: "معلّقة",
  NOT_ELIGIBLE: "غير مستحقة",
  DUE: "مستحقة",
  PAID: "مدفوعة",
};
const sourceLabels: Record<string, string> = {
  DIRECT: "إحالة مباشرة",
  AMBASSADOR: "رابط السفير",
  PARTNER: "شريك تنفيذ",
  MANUAL: "إدخال يدوي من الإدارة",
  AI_CHAT: "المساعد الذكي",
};
const statusColors: Record<ReferralStatus, string> = {
  NEW: "bg-sky-50 text-sky-800",
  CONTACTED: "bg-violet-50 text-violet-800",
  INTERESTED: "bg-emerald-50 text-emerald-800",
  AWAITING_RESPONSE: "bg-amber-50 text-amber-800",
  NOT_INTERESTED: "bg-slate-100 text-slate-700",
  CONVERTED: "bg-teal-100 text-teal-900",
};

export default function ReferralAdmin() {
  const [items, setItems] = useState<Referral[]>([]);
  const [ambassadors, setAmbassadors] = useState<AmbassadorOption[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  async function load(query = "") {
    const response = await fetch(`/api/admin/referrals?${query}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(dashboardErrorMessage(payload.error, "تعذر تحميل الإحالات"));
    setItems(payload.referrals || []);
    setAmbassadors(payload.ambassadors || []);
  }

  useEffect(() => {
    void Promise.resolve().then(() => load()).catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل الإحالات"));
  }, []);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    load(new URLSearchParams(new FormData(event.currentTarget) as never).toString())
      .catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تطبيق الفلاتر"));
  }

  async function saveReferral(referral: Referral, values: ReferralDraft) {
    setBusyId(referral.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: referral.id, ...values }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(errorLabels[payload.error] || dashboardErrorMessage(payload.error, "تعذر حفظ الإحالة"));
      setItems((current) => current.map((item) => item.id === referral.id ? payload.referral : item));
      setCollapsedIds((current) => {
        const next = new Set(current);
        next.add(referral.id);
        return next;
      });
      setMessage(`تم حفظ إحالة «${referral.name || "دون اسم"}» بنجاح.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ الإحالة");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell active="referrals" title="إدارة الإحالات" description="مسار التواصل وقرار الإدارة واستحقاق العمولة في شاشة واحدة واضحة.">
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-bold text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 font-bold text-rose-800">{error}</p>}

      <form onSubmit={filter} className="mt-6 grid gap-3 rounded-2xl border border-[#E5DED0] bg-white p-4 shadow-sm md:grid-cols-4">
        <input name="search" placeholder="بحث بالعميل" className="rounded-xl border border-[#D8D2C4] p-3" />
        <select name="status" className="rounded-xl border border-[#D8D2C4] p-3">
          <option value="">كل حالات التواصل</option>
          {(Object.keys(referralLabels) as ReferralStatus[]).map((status) => <option key={status} value={status}>{referralLabels[status]}</option>)}
        </select>
        <select name="ambassadorId" className="rounded-xl border border-[#D8D2C4] p-3">
          <option value="">كل السفراء</option>
          {ambassadors.map((ambassador) => <option key={ambassador.id} value={ambassador.id}>{ambassador.user.name || ambassador.user.email}</option>)}
        </select>
        <select name="source" className="rounded-xl border border-[#D8D2C4] p-3">
          <option value="">كل مصادر الإحالة</option>
          {Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input name="contactMethod" placeholder="طريقة التواصل" className="rounded-xl border border-[#D8D2C4] p-3" />
        <label className="grid gap-1 text-xs font-bold text-slate-500">من تاريخ<DateInput name="from" className="rounded-xl border border-[#D8D2C4] p-3 text-base text-slate-900" /></label>
        <label className="grid gap-1 text-xs font-bold text-slate-500">إلى تاريخ<DateInput name="to" className="rounded-xl border border-[#D8D2C4] p-3 text-base text-slate-900" /></label>
        <button className="self-end rounded-xl bg-[#111827] p-3 font-bold text-white transition hover:bg-[#1F2937]">تطبيق الفلاتر</button>
      </form>

      <div className="mt-6 grid gap-5">
        {items.map((referral) => (
          <ReferralEditor
            key={referral.id}
            referral={referral}
            busy={busyId === referral.id}
            collapsed={collapsedIds.has(referral.id)}
            onCollapse={() => setCollapsedIds((current) => new Set(current).add(referral.id))}
            onExpand={() => setCollapsedIds((current) => {
              const next = new Set(current);
              next.delete(referral.id);
              return next;
            })}
            onSave={saveReferral}
          />
        ))}
        {!items.length && <p className="rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-10 text-center text-slate-500">لا توجد إحالات مطابقة.</p>}
      </div>
    </AdminShell>
  );
}

type ReferralDraft = {
  status: ReferralStatus;
  adminDecision: ReferralDecision;
  adminNotes: string;
  commissionType: CommissionType | null;
  commissionAmount: string | null;
  commissionRate: string | null;
  commissionCurrency: string;
  commissionStatus: CommissionStatus;
};

function ReferralEditor({ referral, busy, collapsed, onCollapse, onExpand, onSave }: { referral: Referral; busy: boolean; collapsed: boolean; onCollapse: () => void; onExpand: () => void; onSave: (referral: Referral, values: ReferralDraft) => Promise<void>; }) {
  const [conversionBusy, setConversionBusy] = useState(false);
  const [conversionSucceeded, setConversionSucceeded] = useState(false);
  const [conversionError, setConversionError] = useState("");
  const initialDraft = useMemo<ReferralDraft>(() => ({
    status: referral.status,
    adminDecision: referral.adminDecision || "PENDING_REVIEW",
    adminNotes: referral.adminNotes || "",
    commissionType: referral.commissionType,
    commissionAmount: referral.commissionAmount,
    commissionRate: referral.commissionRate,
    commissionCurrency: referral.commissionCurrency || referral.clientProject?.currency || "USD",
    commissionStatus: referral.commissionStatus,
  }), [referral]);
  const [draft, setDraft] = useState<ReferralDraft>(initialDraft);
  const hasUnsavedChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initialDraft), [draft, initialDraft]);
  const owner = referral.ambassador?.user || referral.partner?.user;
  const commissionAllowed = ["ACCEPTED", "CONVERTED_TO_CLIENT"].includes(draft.adminDecision) || draft.status === "CONVERTED";
  const contactLooksLikePhone = useMemo(() => /^[+\d][\d\s().-]{7,}$/.test((referral.contactMethod || "").trim()), [referral.contactMethod]);
  const conversionPhone = referral.phone || (contactLooksLikePhone ? referral.contactMethod || "" : "");
  const canConvert = draft.status === "INTERESTED" && draft.adminDecision === "ACCEPTED" && Boolean(referral.email) && !referral.convertedClient;
  const estimatedAmount = useMemo(() => {
    if (draft.commissionType === "PERCENTAGE" && referral.clientProject?.paidAmount && draft.commissionRate) return (referral.clientProject.paidAmount * Number(draft.commissionRate) / 100).toFixed(2);
    return draft.commissionAmount || null;
  }, [draft.commissionAmount, draft.commissionRate, draft.commissionType, referral.clientProject?.paidAmount]);

  function changeDecision(value: ReferralDecision) {
    setDraft((current) => ({ ...current, adminDecision: value, ...(["REJECTED", "CANCELLED"].includes(value) ? { commissionStatus: "NOT_ELIGIBLE" as const, commissionType: null, commissionAmount: null, commissionRate: null } : {}) }));
  }

  async function convertToClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canConvert) return;
    setConversionBusy(true);
    setConversionSucceeded(false);
    setConversionError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const saveResponse = await fetch("/api/admin/referrals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: referral.id, ...draft }) });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(errorLabels[saveData.error] || dashboardErrorMessage(saveData.error, "تعذر حفظ بيانات الإحالة قبل التحويل"));
      let response = await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, referralId: referral.id, sendInvite: form.get("sendInvite") === "on" }) });
      let data = await response.json();
      if (data.error === "PHONE_MATCH_REQUIRES_CONFIRMATION" && window.confirm("رقم الهاتف مستخدم في حساب آخر. هل تريد المتابعة وربط التحويل بالبريد؟")) {
        response = await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, referralId: referral.id, sendInvite: form.get("sendInvite") === "on", confirmPhoneDuplicate: true }) });
        data = await response.json();
      }
      if (!response.ok) throw new Error(dashboardErrorMessage(data.error, "تعذر تحويل الإحالة"));
      setConversionSucceeded(true);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (cause) {
      setConversionError(cause instanceof Error ? cause.message : "تعذر تحويل الإحالة");
    } finally {
      setConversionBusy(false);
    }
  }

  if (collapsed) {
    const clientName = referral.convertedClient?.name || referral.name || referral.convertedClient?.email || "دون اسم";
    const decision = referral.adminDecision || "PENDING_REVIEW";
    return <article className="rounded-2xl border border-[#E2DACB] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryFact label="اسم العميل" value={clientName} /><SummaryFact label="حالة الإحالة" value={<span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusColors[referral.status]}`}>{referralLabels[referral.status]}</span>} /><SummaryFact label="نتيجة القرار" value={decisionLabels[decision]} /><SummaryFact label="آخر تحديث" value={<DateText value={referral.updatedAt} withTime />} /></div><button type="button" aria-expanded="false" onClick={onExpand} className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#B89A5A] bg-[#FCFAF6] px-5 py-3 font-black text-[#9A7D43] transition hover:bg-[#F7F3EB]">عرض التفاصيل<ChevronDown className="h-4 w-4" /></button></div></article>;
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E2DACB] bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EEE7DA] bg-[#FCFAF6] p-5">
        <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{referral.name || "دون اسم"}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[draft.status]}`}>{referralLabels[draft.status]}</span></div><p className="mt-2 text-sm text-slate-600">{referral.email || "—"}{referral.phone ? ` · ${referral.phone}` : ""}</p></div>
        <div className="flex items-start gap-3"><div className="grid gap-1 text-xs text-slate-500 sm:text-left"><span>{sourceLabels[referral.source || ""] || "إحالة مباشرة"} · {referral.contactMethod || "وسيلة التواصل غير محددة"}</span><span>{owner ? `عن طريق ${owner.name || owner.email}` : "دون مسوّق مرتبط"} · <DateText value={referral.createdAt} /></span></div><button type="button" aria-expanded="true" onClick={onCollapse} className="flex shrink-0 items-center gap-1 rounded-lg border border-[#D8D2C4] bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-[#F7F3EB]">طي التفاصيل<ChevronDown className="h-4 w-4 rotate-180" /></button></div>
      </header>

      {referral.convertedClient ? <section className="m-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-black text-emerald-900">بيانات العميل</h3><p className="mt-2 text-sm text-emerald-800">تم التحويل وربط الإحالة بالعميل {referral.convertedClient.name || referral.convertedClient.email}.</p></section> : <form id={`convert-${referral.id}`} onSubmit={convertToClient} className="m-5 grid gap-3 rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-4 md:grid-cols-2"><div className="md:col-span-2"><h3 className="font-black">بيانات العميل</h3><p className="mt-1 text-sm text-slate-600">البيانات من الإحالة مباشرة. راجعها وعدّلها فقط إذا لزم الأمر.</p></div><label className="grid gap-1 text-sm font-bold">الاسم<input name="name" required defaultValue={referral.name || ""} className="rounded-xl border border-[#D8D2C4] bg-white p-3 font-normal" /></label><label className="grid gap-1 text-sm font-bold">البريد<input name="email" type="email" required defaultValue={referral.email || ""} className="rounded-xl border border-[#D8D2C4] bg-white p-3 font-normal" /></label><label className="grid gap-1 text-sm font-bold">الهاتف<input name="phone" defaultValue={conversionPhone} className="rounded-xl border border-[#D8D2C4] bg-white p-3 font-normal" /></label><label className="grid gap-1 text-sm font-bold">الشركة<input name="company" defaultValue={referral.company || ""} className="rounded-xl border border-[#D8D2C4] bg-white p-3 font-normal" /></label>{!contactLooksLikePhone && referral.contactMethod && <div className="md:col-span-2 rounded-xl border border-[#E5DED0] bg-white p-3 text-sm"><span className="font-bold">وسيلة التواصل الأصلية: </span><span>{referral.contactMethod}</span></div>}<label className="grid gap-1 text-sm font-bold">اللغة<select name="preferredLanguage" defaultValue="ar" className="rounded-xl border border-[#D8D2C4] bg-white p-3 font-normal"><option value="ar">العربية</option><option value="en">English</option></select></label><label className="grid gap-1 text-sm font-bold">ملاحظات العميل / الاحتياج<textarea name="internalNotes" defaultValue={referral.notes || ""} className="rounded-xl border border-[#D8D2C4] bg-white p-3 font-normal" /></label></form>}

      <div className="grid gap-5 p-5 pt-0 xl:grid-cols-3">
        <section className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4"><SectionTitle icon={MessageSquareText} title="حالة التواصل" subtitle="ما المرحلة الحالية مع العميل؟" /><label className="mt-4 grid gap-2 text-sm font-bold">حالة الإحالة<select disabled={Boolean(referral.convertedClient)} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ReferralStatus }))} className="rounded-xl border border-sky-200 bg-white p-3 font-normal disabled:opacity-60">{(Object.keys(referralLabels) as ReferralStatus[]).filter((status) => status !== "CONVERTED" || Boolean(referral.convertedClient)).map((status) => <option key={status} value={status}>{referralLabels[status]}</option>)}</select></label>{referral.sourcePath && <p className="mt-4 text-xs leading-6 text-slate-500">مسار المصدر: <span dir="ltr">{referral.sourcePath}</span></p>}</section>
        <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4"><SectionTitle icon={BadgeCheck} title="قرار الإدارة" subtitle="قرار مستقل عن مسار التواصل." /><label className="mt-4 grid gap-2 text-sm font-bold">القرار<select value={draft.adminDecision} onChange={(event) => changeDecision(event.target.value as ReferralDecision)} className="rounded-xl border border-amber-200 bg-white p-3 font-normal">{(Object.keys(decisionLabels) as ReferralDecision[]).filter((decision) => decision !== "CONVERTED_TO_CLIENT" || Boolean(referral.convertedClient)).map((decision) => <option key={decision} value={decision}>{decisionLabels[decision]}</option>)}</select></label><label className="mt-3 grid gap-2 text-sm font-bold">ملاحظات الإدارة<textarea value={draft.adminNotes} onChange={(event) => setDraft((current) => ({ ...current, adminNotes: event.target.value }))} rows={4} placeholder="تفاصيل التواصل أو سبب القرار عند الحاجة" className="resize-y rounded-xl border border-amber-200 bg-white p-3 font-normal" /></label></section>
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"><SectionTitle icon={CircleDollarSign} title="بيانات العمولة" subtitle="تُستحق بعد تحقق الشرط المالي." />{!commissionAllowed ? <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600">اعتمد الإحالة أولًا أو حوّلها إلى عميل قبل إدخال العمولة.</p> : <div className="mt-4 grid gap-3"><label className="grid gap-2 text-sm font-bold">نوع العمولة<select value={draft.commissionType || ""} onChange={(event) => setDraft((current) => ({ ...current, commissionType: (event.target.value || null) as CommissionType | null, commissionAmount: null, commissionRate: null }))} className="rounded-xl border border-emerald-200 bg-white p-3 font-normal"><option value="">دون عمولة محددة</option><option value="FIXED">مبلغ ثابت</option><option value="PERCENTAGE">نسبة مئوية</option></select></label>{draft.commissionType === "FIXED" && <label className="grid gap-2 text-sm font-bold">مبلغ العمولة<input type="number" min="0" step="0.01" value={draft.commissionAmount || ""} onChange={(event) => setDraft((current) => ({ ...current, commissionAmount: event.target.value || null }))} className="rounded-xl border border-emerald-200 bg-white p-3 font-normal" /></label>}{draft.commissionType === "PERCENTAGE" && <><label className="grid gap-2 text-sm font-bold">نسبة العمولة<input type="number" min="0.01" max="100" step="0.01" value={draft.commissionRate || ""} onChange={(event) => setDraft((current) => ({ ...current, commissionRate: event.target.value || null }))} className="rounded-xl border border-emerald-200 bg-white p-3 font-normal" /></label><p className="rounded-xl bg-white p-3 text-xs leading-6 text-slate-600">قيمة الدفعات المعتمدة: <strong>{referral.clientProject?.paidAmount.toFixed(2) || "0.00"} {referral.clientProject?.currency || draft.commissionCurrency}</strong><br />العمولة المحسوبة: <strong>{estimatedAmount || "0.00"} {referral.clientProject?.currency || draft.commissionCurrency}</strong></p></>}{estimatedAmount && <label className="grid gap-2 text-sm font-bold">العملة<select value={draft.commissionCurrency} onChange={(event) => setDraft((current) => ({ ...current, commissionCurrency: event.target.value }))} className="rounded-xl border border-emerald-200 bg-white p-3 font-normal">{[referral.clientProject?.currency, "USD", "EUR", "SYP", "TRY"].filter((value, index, all): value is string => Boolean(value) && all.indexOf(value) === index).map((currency) => <option key={currency}>{currency}</option>)}</select></label>}<label className="grid gap-2 text-sm font-bold">حالة العمولة<select value={draft.commissionStatus} onChange={(event) => setDraft((current) => ({ ...current, commissionStatus: event.target.value as CommissionStatus }))} className="rounded-xl border border-emerald-200 bg-white p-3 font-normal">{(Object.keys(commissionLabels) as CommissionStatus[]).map((status) => <option key={status} value={status} disabled={(status === "PAID" && Boolean(referral.partner || referral.source === "PARTNER")) || ((status === "DUE" || status === "PAID") && !referral.clientProject?.hasPaidInvoice)}>{commissionLabels[status]}</option>)}</select></label>{!referral.clientProject?.hasPaidInvoice && <p className="text-xs leading-5 text-amber-800">لا يمكن جعل العمولة مستحقة قبل تسجيل دفعة عميل مرتبطة بالمشروع.</p>}</div>}</section>
        {(referral.partner || referral.source === "PARTNER") && <p className="text-xs leading-6 text-amber-800">تسجيل دفع عمولات إحالات الشركاء معطل هنا لعدم وجود مسار إثبات دفع معتمد. لا تُعد دفعة العميل إثباتًا لدفع عمولة الشريك.</p>}
      </div>

      {referral.notes && <section className="mx-5 mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><SectionTitle icon={MessageSquareText} title="تفاصيل الطلب" subtitle="المعلومات التي قدّمها العميل أو ولّدها مسار المصدر." /><p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-white p-4 text-sm leading-7 text-slate-700">{referral.notes}</p></section>}

      {!referral.convertedClient && <section className="mx-5 mb-5 rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-4"><div className="flex flex-wrap items-center justify-between gap-4"><label className="flex animate-pulse items-center gap-3 rounded-xl border border-[#B89A5A] bg-[#FFF8E8] px-4 py-3 font-black text-[#7A5E27] shadow-sm"><input form={`convert-${referral.id}`} type="checkbox" name="sendInvite" />إرسال دعوة إلى العميل</label><button form={`convert-${referral.id}`} type="submit" disabled={!canConvert || conversionBusy || conversionSucceeded} className="rounded-xl bg-[#B89A5A] px-6 py-3 font-black text-[#111827] transition hover:bg-[#C6AA69] disabled:cursor-not-allowed disabled:opacity-50">{conversionBusy ? "جارٍ التحويل..." : conversionSucceeded ? "تم التحويل ✓" : "تحويل إلى عميل"}</button></div>{!canConvert && <p className="mt-3 text-xs font-bold text-amber-800">لإتاحة التحويل اختر حالة «مهتم» وقرار «مقبولة».</p>}{conversionError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{conversionError}</p>}</section>}

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EEE7DA] px-5 py-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-4 w-4" />{referral.updatedBy ? <span>آخر تعديل: {referral.updatedBy.name || referral.updatedBy.email} · <DateText value={referral.updatedAt} withTime /></span> : <span>لم يُسجّل تعديل إداري بعد</span>}</div>{(!canConvert && !referral.convertedClient && hasUnsavedChanges) && <button disabled={busy} onClick={() => void onSave(referral, draft)} className="rounded-xl bg-[#111827] px-6 py-3 font-black text-white transition hover:bg-[#1F2937] disabled:cursor-wait disabled:opacity-50">{busy ? "جارٍ الحفظ..." : "حفظ التغييرات"}</button>}{referral.convertedClient && hasUnsavedChanges && <button disabled={busy} onClick={() => void onSave(referral, draft)} className="rounded-xl bg-[#111827] px-6 py-3 font-black text-white transition hover:bg-[#1F2937] disabled:cursor-wait disabled:opacity-50">{busy ? "جارٍ الحفظ..." : "حفظ التعديلات الإدارية"}</button>}</footer>
    </article>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof UserRound; title: string; subtitle: string }) { return <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm"><Icon className="h-5 w-5" /></span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div></div>; }
function SummaryFact({ label, value }: { label: string; value: ReactNode }) { return <div className="min-w-0"><p className="text-xs font-bold text-slate-500">{label}</p><div className="mt-2 truncate font-black text-[#111827]">{value}</div></div>; }

const errorLabels: Record<string, string> = {
  INVALID: "حالة الإحالة غير صالحة.",
  INVALID_DECISION: "قرار الإدارة غير صالح.",
  INVALID_COMMISSION: "قيمة العمولة أو نسبتها غير صالحة.",
  INVALID_CURRENCY: "عملة العمولة غير صالحة.",
  INVALID_COMMISSION_STATUS: "حالة العمولة غير صالحة.",
  REFERRAL_NOT_APPROVED: "يجب قبول الإحالة أو تحويلها إلى عميل قبل إدخال العمولة.",
  CONFLICTING_STATUSES: "لا يمكن أن تكون الإحالة مرفوضة أو ملغاة والعمولة مستحقة.",
  FINANCIAL_CONDITION_NOT_MET: "لا يمكن استحقاق العمولة قبل تسجيل دفعة عميل مرتبطة بالمشروع.",
  COMMISSION_AMOUNT_REQUIRED: "أدخل مبلغ العمولة قبل اعتماد هذه الحالة.",
  COMMISSION_RATE_REQUIRED: "أدخل نسبة العمولة الصحيحة.",
  COMMISSION_NOT_DUE: "حوّل العمولة إلى مستحقة واحفظها قبل تسجيلها كمدفوعة.",
  NOT_FOUND: "الإحالة غير موجودة.",
};
