"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Plus } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { DateText } from "@/components/ui/date-text";

type StageStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type StagePaymentStatus = "PENDING" | "PAID" | "CANCELLED";
type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

type Stage = {
  id: string;
  projectId: string;
  name: string;
  amount: string;
  currency: string;
  status: StageStatus;
  paymentStatus: StagePaymentStatus;
  startsAt: string | null;
  completedAt: string | null;
  paidAt: string | null;
  approvedAt: string | null;
};

type Props = {
  projectId: string;
  title: string;
  clientName: string;
  clientEmail: string;
  partners: string[];
  status: string;
  progress: number;
  currency: string;
  dueAt: string | null;
  description: string | null;
  agreementDetails: string | null;
  financialPlan: string | null;
  legacyStages: string | null;
  links: string[];
  notes: string | null;
};

type StageSuggestion = { name: string; amount: number | null; valid: boolean };

const stageStatusLabel: Record<StageStatus, string> = {
  NOT_STARTED: "لم تبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};
const paymentStatusLabel: Record<StagePaymentStatus, string> = {
  PENDING: "بانتظار الدفع",
  PAID: "مدفوعة",
  CANCELLED: "ملغاة",
};
const projectStatusLabel: Record<ProjectStatus, string> = {
  PLANNING: "التخطيط",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "المراجعة",
  COMPLETED: "مكتمل",
  ON_HOLD: "متوقف مؤقتًا",
  CANCELLED: "ملغى",
};

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)))
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .trim();
}

function stageNames(value: string | null) {
  return (value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function financialLines(value: string | null) {
  return (value || "")
    .split(/\r?\n/)
    .map(normalizeDigits)
    .filter(Boolean);
}

function amountFromLine(source: string) {
  const match = source.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة))/i);
  const amount = Number((match?.[1] || match?.[2] || "0").replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function legacyNameFromFinancialLine(source: string) {
  const withoutStageLabel = source.replace(/^\s*المرحلة\s+(?:الأولى|الاولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|\d+)\s*[:：.]?\s*/i, "");
  const amountMatch = withoutStageLabel.match(/(?:\$\s*([0-9][0-9.,]*)|([0-9][0-9.,]*)\s*(?:\$|USD|EUR|SYP|TRY|دولار|دولارات|يورو|ليرة))/i);
  if (!amountMatch || amountMatch.index === undefined) return withoutStageLabel.replace(/[\s،,:：.\-–—]+$/g, "").trim();
  return withoutStageLabel.slice(0, amountMatch.index).replace(/[\s،,:：.\-–—]+$/g, "").trim();
}

function stageSuggestion(stagesValue: string | null, financialPlan: string | null, index: number): StageSuggestion {
  const names = stageNames(stagesValue);
  const lines = financialLines(financialPlan);
  const source = lines[index] || "";
  const name = names.length ? names[index] || "" : legacyNameFromFinancialLine(source);
  const amount = amountFromLine(source);
  return { name, amount, valid: Boolean(name) && amount !== null };
}

function plannedTotal(financialPlan: string | null) {
  return financialLines(financialPlan).reduce((sum, line) => sum + (amountFromLine(line) || 0), 0);
}

function plannedStageCount(stagesValue: string | null, financialPlan: string | null) {
  const names = stageNames(stagesValue);
  if (names.length) return names.length;
  const lines = financialLines(financialPlan);
  return lines.map((_, index) => stageSuggestion(null, financialPlan, index)).filter((item) => item.valid).length;
}

function planSyncError(stagesValue: string | null, financialPlan: string | null) {
  const names = stageNames(stagesValue);
  if (!names.length) return "أدخل مراحل المشروع أولًا، مرحلة واحدة في كل سطر.";
  const amounts = financialLines(financialPlan).map(amountFromLine).filter((value): value is number => value !== null);
  if (amounts.length !== names.length) {
    return `عدد مبالغ الخطة المالية (${amounts.length}) يجب أن يساوي عدد مراحل المشروع (${names.length}). اكتب مبلغًا واحدًا لكل مرحلة في سطر مستقل.`;
  }
  return null;
}

export function ProjectExecutionPlan(props: Props) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>((props.status as ProjectStatus) || "PLANNING");
  const [progress, setProgress] = useState(Math.max(0, Math.min(100, props.progress || 0)));

  async function loadStages() {
    setLoading(true);
    setMessage("");
    try {
      let response = await fetch(`/api/admin/project-stages?projectId=${encodeURIComponent(props.projectId)}`, { cache: "no-store" });
      let data = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(data.error || "تعذر تحميل مراحل التنفيذ");

      let nextStages = (data.projects?.[0]?.projectStages || []) as Stage[];
      if (!nextStages.length) {
        const syncError = planSyncError(props.legacyStages, props.financialPlan);
        if (!syncError) {
          const syncResponse = await fetch("/api/admin/project-stages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync_from_project", projectId: props.projectId }),
          });
          const syncPayload = await syncResponse.json().catch(() => ({}));
          if (!syncResponse.ok) {
            setStages([]);
            setLoaded(true);
            return setMessage(syncPayload.error || "تعذر مزامنة مراحل المشروع مع خطة التنفيذ");
          }

          response = await fetch(`/api/admin/project-stages?projectId=${encodeURIComponent(props.projectId)}`, { cache: "no-store" });
          data = await response.json().catch(() => ({}));
          if (!response.ok) return setMessage(data.error || "تعذر إعادة تحميل مراحل التنفيذ بعد المزامنة");
          nextStages = (data.projects?.[0]?.projectStages || []) as Stage[];
          if (syncPayload.created > 0) setMessage(`تمت مزامنة ${syncPayload.created} مراحل تلقائيًا من بيانات المشروع.`);
        } else {
          setMessage(syncError);
        }
      }

      setStages(nextStages);
      setLoaded(true);
    } catch {
      setMessage("تعذر الاتصال بخدمة مراحل التنفيذ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (open && !loaded) void loadStages(); }, [open, loaded]);

  const nextStageNumber = stages.length + 1;
  const suggestion = useMemo(() => stageSuggestion(props.legacyStages, props.financialPlan, stages.length), [props.legacyStages, props.financialPlan, stages.length]);
  const totalPlanned = useMemo(() => plannedTotal(props.financialPlan), [props.financialPlan]);
  const totalPlannedStages = useMemo(() => plannedStageCount(props.legacyStages, props.financialPlan), [props.legacyStages, props.financialPlan]);
  const paidAmount = useMemo(() => stages.filter((stage) => stage.paymentStatus === "PAID").reduce((sum, stage) => sum + Number(stage.amount || 0), 0), [stages]);
  const financialPercent = totalPlanned > 0 ? Math.min(100, Math.round((paidAmount / totalPlanned) * 100)) : 0;
  const completedStages = stages.filter((stage) => stage.status === "COMPLETED").length;
  const automaticProgress = totalPlannedStages > 0 ? Math.min(100, Math.round((completedStages / totalPlannedStages) * 100)) : 0;
  const displayProgress = Math.max(progress, automaticProgress);
  const currentStage = stages.find((stage) => !["COMPLETED", "CANCELLED"].includes(stage.status));
  const hasNextStage = !currentStage && completedStages < totalPlannedStages;
  const phaseLabel = currentStage ? "المرحلة الحالية" : hasNextStage ? "المرحلة التالية" : "حالة المراحل";
  const phaseValue = totalPlannedStages === 0
    ? "لم تُحدد مراحل المشروع بعد"
    : currentStage?.name || (hasNextStage ? `${suggestion.name || `المرحلة ${completedStages + 1}`} — لم تبدأ بعد` : "اكتملت جميع المراحل");

  async function saveProjectProgress() {
    setBusy("project-progress");
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: props.projectId, status: projectStatus, progress: Math.max(progress, automaticProgress) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(payload.error || "تعذر تحديث تقدم المشروع");
      setProgress(Math.max(progress, automaticProgress));
      setMessage("تم تحديث حالة المشروع ونسبة التقدم.");
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم يُحفظ تقدم المشروع.");
    } finally {
      setBusy(null);
    }
  }

  async function createNextStage() {
    if (!suggestion.valid || suggestion.amount === null) return setMessage("تعذر قراءة اسم المرحلة التالية أو مبلغها من بيانات المشروع والخطة المالية.");
    const firstStage = stages.length === 0;
    setBusy("create");
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", projectId: props.projectId, name: suggestion.name, amount: suggestion.amount, dueAt: null, sendPaymentRequest: firstStage }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return setMessage(payload.error || "تعذر إنشاء المرحلة");
      setMessage(firstStage ? `تم إنشاء المرحلة الأولى وإرسال مطالبة الدفع${payload.invoiceNumber ? ` — ${payload.invoiceNumber}` : ""}.` : `تم إنشاء المرحلة ${nextStageNumber} تلقائيًا.`);
      await loadStages();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تُحفظ المرحلة.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStage(event: FormEvent<HTMLFormElement>, stage: Stage): Promise<boolean> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(stage.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", stageId: stage.id, name: data.get("name"), amount: Number(data.get("amount")), status: data.get("status"), paymentStatus: data.get("paymentStatus"), dueAt: data.get("dueAt"), approved: data.get("approved") === "on" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "تعذر تحديث المرحلة");
        return false;
      }
      setMessage("تم تحديث المرحلة.");
      await loadStages();
      return true;
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تُحفظ التعديلات.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group mt-2 rounded-xl border border-[#D8D2C4] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-black text-[#9A7D43]">
        <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />خطة التنفيذ</span>
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-4 border-t border-[#E6E0D4] p-4">
        {message && <p className="rounded-xl border border-[#D8D2C4] bg-white p-3 text-sm font-bold">{message}</p>}

        <section className="rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E6E0D4] bg-white p-4">
              <div className="flex items-center justify-between gap-3"><strong>تقدم التنفيذ الفعلي</strong><span className="text-3xl font-black text-[#9A7D43]">{displayProgress}%</span></div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#F7F3EB]"><div className="h-full bg-[#B89A5A] transition-all" style={{ width: `${displayProgress}%` }} /></div>
              <p className="mt-2 text-xs font-bold text-slate-500">يُرفع تلقائيًا عند اكتمال المراحل المخططة، ويمكن رفعه يدويًا أثناء التنفيذ.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3"><Fact label={phaseLabel} value={phaseValue} /><Fact label="مراحل مكتملة" value={`${completedStages} من ${totalPlannedStages}`} /><Fact label="حالة المشروع" value={projectStatusLabel[projectStatus]} /></div>
            </div>
            <div className="rounded-2xl border border-[#E6E0D4] bg-white p-4">
              <div className="flex items-center justify-between gap-3"><strong>التقدم المالي</strong><span className="text-3xl font-black text-[#9A7D43]">{financialPercent}%</span></div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#F7F3EB]"><div className="h-full bg-[#B89A5A] transition-all" style={{ width: `${financialPercent}%` }} /></div>
              <p className="mt-2 text-xs font-bold text-slate-500">يعكس نسبة المبالغ المدفوعة من إجمالي الخطة المالية.</p>
              <p className="mt-3 text-sm font-bold text-slate-600">المدفوع {paidAmount.toLocaleString("ar")} من {totalPlanned.toLocaleString("ar")} {props.currency}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-[#E6E0D4] pt-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="حالة المشروع"><select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as ProjectStatus)} className="field">{Object.entries(projectStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="نسبة تقدم التنفيذ"><input type="number" min={automaticProgress} max={100} value={Math.max(progress, automaticProgress)} onChange={(event) => setProgress(Math.max(automaticProgress, Math.min(100, Number(event.target.value) || 0)))} className="field" /></Field>
            <button type="button" disabled={busy === "project-progress"} onClick={() => void saveProjectProgress()} className="self-end rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50">{busy === "project-progress" ? "جارٍ الحفظ..." : "حفظ التقدم"}</button>
          </div>
        </section>

        <section className="grid gap-3">
          {loading && <p className="rounded-xl bg-[#F7F3EB] p-4 text-sm font-bold">جارٍ تحميل المراحل...</p>}
          {!loading && stages.map((stage, index) => (
            <article key={stage.id} className="rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-[#9A7D43]">المرحلة {index + 1}</p><h4 className="mt-1 text-lg font-black">{stage.name}</h4></div><div className="flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-white px-3 py-1.5">{stageStatusLabel[stage.status]}</span><span className="rounded-full bg-white px-3 py-1.5">{paymentStatusLabel[stage.paymentStatus]}</span></div></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3"><Fact label="المبلغ" value={`${stage.amount} ${stage.currency}`} /><Fact label="حالة الدفع" value={paymentStatusLabel[stage.paymentStatus]} /><Fact label="تاريخ استحقاق الدفع" value={<DateText value={stage.startsAt} fallback="غير محدد" />} /></div>
              <details className="group mt-3 rounded-xl border border-[#D8D2C4] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-sm font-black">تحديث المرحلة<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
                <StageUpdateForm stage={stage} busy={busy === stage.id} onSubmit={(event) => updateStage(event, stage)} />
              </details>
            </article>
          ))}
        </section>

        {!loading && loaded && suggestion.valid && suggestion.amount !== null && stages.length < totalPlannedStages && <section className="rounded-xl border border-[#D8D2C4] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black text-[#9A7D43]">المرحلة {nextStageNumber}</p><h4 className="mt-1 text-lg font-black">{suggestion.name}</h4><p className="mt-1 text-sm font-bold text-slate-500">{suggestion.amount} {props.currency}</p></div><button type="button" onClick={() => void createNextStage()} disabled={busy === "create"} className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white disabled:opacity-50"><Plus className="h-5 w-5" />{busy === "create" ? "جارٍ الإنشاء..." : stages.length ? "+ إنشاء المرحلة التالية" : "إنشاء المرحلة الأولى وإرسال مطالبة الدفع"}</button></div></section>}
        {!loading && loaded && totalPlannedStages === 0 && <p className="rounded-xl bg-[#F7F3EB] p-4 text-sm font-bold text-slate-600">لم تُحدد مراحل المشروع بعد. أضف أسماء المراحل والخطة المالية من نموذج المشروع.</p>}
        {!loading && loaded && totalPlannedStages > 0 && stages.length >= totalPlannedStages && <p className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">جميع مراحل المشروع موجودة ضمن خطة التنفيذ.</p>}
        {!loading && loaded && totalPlannedStages > stages.length && !suggestion.valid && <p className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-800">بيانات المرحلة التالية غير مكتملة. تأكد أن لكل مرحلة اسمًا ومبلغًا مقابلًا لها في الخطة المالية.</p>}
      </div>
    </details>
  );
}

function StageUpdateForm({
  stage,
  busy,
  onSubmit,
}: {
  stage: Stage;
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
}) {
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  async function submitStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || busy) return;
    const ok = await onSubmit(event);
    if (ok) {
      setDirty(false);
      setSaved(true);
    }
  }

  const buttonLabel = busy ? "جارٍ الحفظ..." : saved ? "✓ تم الحفظ" : dirty ? "حفظ التغييرات" : "لا توجد تغييرات";

  return (
    <form onSubmit={submitStage} onChange={markDirty} className="grid gap-3 border-t border-[#E6E0D4] p-3 md:grid-cols-2">
      <Field label="اسم المرحلة"><input name="name" defaultValue={stage.name} required className="field" /></Field>
      <Field label="المبلغ"><input name="amount" type="number" min="0.01" step="0.01" defaultValue={stage.amount} required className="field" /></Field>
      <Field label="الحالة"><select name="status" defaultValue={stage.status} className="field">{Object.entries(stageStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="حالة الدفع"><select name="paymentStatus" defaultValue={stage.paymentStatus} className="field">{Object.entries(paymentStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="تاريخ استحقاق الدفع"><DateInput name="dueAt" defaultValue={stage.startsAt?.slice(0, 10) || ""} className="field" /></Field>
      <label className="flex items-center gap-3 rounded-xl bg-[#F7F3EB] p-4 text-sm font-bold"><input name="approved" type="checkbox" defaultChecked={Boolean(stage.approvedAt)} />اعتماد المرحلة بعد اكتمالها</label>
      <button disabled={busy || !dirty} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2">{buttonLabel}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black">{label}{children}</label>;
}
function Fact({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-500">{label}</p><div className="mt-1 font-black">{value}</div></div>;
}
