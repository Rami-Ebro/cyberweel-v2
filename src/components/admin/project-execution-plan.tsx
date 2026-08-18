"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Plus } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { DateText } from "@/components/ui/date-text";
import { dashboardLabel } from "@/lib/dashboard-labels";

type StageStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type StagePaymentStatus = "PENDING" | "PAID" | "CANCELLED";

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

function normalizeDigits(value: string) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function stageSuggestion(financialPlan: string | null, index: number) {
  const lines = (financialPlan || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const line = lines[index] || "";
  if (!line) return { name: "", amount: "" };

  const normalized = normalizeDigits(line);
  const amountMatch = normalized.match(/(?:\$\s*([\d.,]+)|([\d.,]+)\s*(?:USD|EUR|SYP|TRY|\$|دولار))/i);
  const rawAmount = (amountMatch?.[1] || amountMatch?.[2] || "").replace(/,/g, "");
  const amount = Number(rawAmount);
  const name = normalized
    .replace(/^المرحلة\s+(?:الأولى|الاولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|\d+)\s*[:：\-–—]?\s*/i, "")
    .replace(/(?:\$\s*[\d.,]+|[\d.,]+\s*(?:USD|EUR|SYP|TRY|\$|دولار)).*$/i, "")
    .replace(/[.،,:：\-–—\s]+$/g, "")
    .trim();

  return {
    name,
    amount: Number.isFinite(amount) && amount > 0 ? String(amount) : "",
  };
}

export function ProjectExecutionPlan(props: Props) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadStages() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/project-stages?projectId=${encodeURIComponent(props.projectId)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "تعذر تحميل مراحل التنفيذ");
        return;
      }
      setStages(data.projects?.[0]?.projectStages || []);
      setLoaded(true);
    } catch {
      setMessage("تعذر الاتصال بخدمة مراحل التنفيذ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !loaded) void loadStages();
  }, [open, loaded]);

  const nextStageNumber = stages.length + 1;
  const suggestion = useMemo(
    () => stageSuggestion(props.financialPlan, stages.length),
    [props.financialPlan, stages.length],
  );

  async function createStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const firstStage = stages.length === 0;
    setBusy("create");
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          projectId: props.projectId,
          name: data.get("name"),
          amount: Number(data.get("amount")),
          dueAt: data.get("dueAt"),
          sendPaymentRequest: firstStage,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "تعذر إنشاء المرحلة");
        return;
      }
      setMessage(
        firstStage
          ? `تم إنشاء المرحلة الأولى وإرسال مطالبة الدفع${payload.invoiceNumber ? ` — ${payload.invoiceNumber}` : ""}.`
          : `تم إنشاء المرحلة ${nextStageNumber}.`,
      );
      form.reset();
      await loadStages();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تُحفظ المرحلة.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStage(event: FormEvent<HTMLFormElement>, stage: Stage) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(stage.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/project-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          stageId: stage.id,
          name: data.get("name"),
          amount: Number(data.get("amount")),
          status: data.get("status"),
          paymentStatus: data.get("paymentStatus"),
          dueAt: data.get("dueAt"),
          approved: data.get("approved") === "on",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "تعذر تحديث المرحلة");
        return;
      }
      setMessage("تم تحديث المرحلة.");
      await loadStages();
    } catch {
      setMessage("تعذر الاتصال بالخادم. لم تُحفظ التعديلات.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group mt-2 rounded-xl border border-[#D8D2C4] bg-white"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-black text-[#9A7D43]">
        <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />خطة التنفيذ</span>
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-5 border-t border-[#E6E0D4] p-4">
        <section className="grid gap-4 rounded-2xl bg-[#F7F3EB] p-4 md:grid-cols-2">
          <ReadField label="العميل" value={`${props.clientName} — ${props.clientEmail}`} />
          <ReadField label="شركاء التنفيذ" value={props.partners.join("، ") || "غير مسند"} />
          <ReadField label="اسم المشروع" value={props.title} />
          <ReadField label="الحالة" value={dashboardLabel(props.status, props.status)} />
          <ReadField label="نسبة التقدم" value={`${props.progress}%`} />
          <ReadField label="موعد التسليم" value={props.dueAt ? new Date(props.dueAt).toLocaleDateString("ar") : "غير محدد"} />
          <ReadField label="العملة" value={props.currency} />
          <ReadArea label="الوصف" value={props.description || ""} />
          <ReadArea label="تفاصيل الاتفاق ونطاق العمل" value={props.agreementDetails || ""} wide />
          <ReadArea label="الخطة المالية" value={props.financialPlan || ""} wide />
          <ReadArea label="مراحل المشروع المتفق عليها" value={props.legacyStages || ""} wide />
          <ReadArea label="روابط المشروع" value={props.links.join("\n")} wide dir="ltr" />
          <ReadArea label="ملاحظات داخلية" value={props.notes || ""} wide />
        </section>

        {message && <p className="rounded-xl border border-[#D8D2C4] bg-white p-3 text-sm font-bold">{message}</p>}

        <section className="grid gap-3">
          {loading && <p className="rounded-xl bg-[#F7F3EB] p-4 text-sm font-bold">جارٍ تحميل المراحل...</p>}
          {!loading && stages.map((stage, index) => (
            <article key={stage.id} className="rounded-2xl border border-[#D8D2C4] bg-[#FCFAF6] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#9A7D43]">المرحلة {index + 1}</p>
                  <h4 className="mt-1 text-lg font-black">{stage.name}</h4>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-white px-3 py-1.5">{stageStatusLabel[stage.status]}</span>
                  <span className="rounded-full bg-white px-3 py-1.5">{paymentStatusLabel[stage.paymentStatus]}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Fact label="المبلغ" value={`${stage.amount} ${stage.currency}`} />
                <Fact label="الدفع" value={paymentStatusLabel[stage.paymentStatus]} />
                <Fact label="الاستحقاق" value={<DateText value={stage.startsAt} fallback="غير محدد" />} />
              </div>
              <details className="group mt-3 rounded-xl border border-[#D8D2C4] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-sm font-black">
                  تحديث المرحلة
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </summary>
                <form onSubmit={(event) => updateStage(event, stage)} className="grid gap-3 border-t border-[#E6E0D4] p-3 md:grid-cols-2">
                  <Field label="اسم المرحلة"><input name="name" defaultValue={stage.name} required className="field" /></Field>
                  <Field label="المبلغ"><input name="amount" type="number" min="0.01" step="0.01" defaultValue={stage.amount} required className="field" /></Field>
                  <Field label="الحالة"><select name="status" defaultValue={stage.status} className="field">{Object.entries(stageStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  <Field label="حالة الدفع"><select name="paymentStatus" defaultValue={stage.paymentStatus} className="field">{Object.entries(paymentStatusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                  <Field label="تاريخ الاستحقاق"><DateInput name="dueAt" defaultValue={stage.startsAt?.slice(0, 10) || ""} className="field" /></Field>
                  <label className="flex items-center gap-3 rounded-xl bg-[#F7F3EB] p-4 text-sm font-bold"><input name="approved" type="checkbox" defaultChecked={Boolean(stage.approvedAt)} />اعتماد المرحلة بعد اكتمالها</label>
                  <button disabled={busy === stage.id} className="rounded-xl bg-[#111827] px-5 py-3 font-black text-white disabled:opacity-50 md:col-span-2">{busy === stage.id ? "جارٍ الحفظ..." : "حفظ تحديث المرحلة"}</button>
                </form>
              </details>
            </article>
          ))}
        </section>

        {!loading && loaded && (
          <form key={`${props.projectId}-${nextStageNumber}`} onSubmit={createStage} className="grid gap-3 rounded-2xl border border-[#D8D2C4] bg-white p-4 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#9A7D43]">المرحلة {nextStageNumber}</p>
                <h4 className="text-lg font-black">{stages.length ? "إنشاء المرحلة التالية" : "إنشاء المرحلة الأولى"}</h4>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#111827] text-white"><Plus className="h-5 w-5" /></span>
            </div>
            <Field label="اسم المرحلة"><input name="name" required defaultValue={suggestion.name} className="field" /></Field>
            <Field label="المبلغ"><input name="amount" type="number" min="0.01" step="0.01" required defaultValue={suggestion.amount} className="field" /></Field>
            <Field label="تاريخ الاستحقاق"><DateInput name="dueAt" className="field" /></Field>
            <button disabled={busy === "create"} className="rounded-xl bg-[#111827] px-5 py-3.5 font-black text-white disabled:opacity-50 md:col-span-2">
              {busy === "create" ? "جارٍ الإنشاء..." : stages.length ? "+ إنشاء المرحلة التالية" : "إنشاء المرحلة الأولى وإرسال مطالبة الدفع"}
            </button>
          </form>
        )}
      </div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-black">{label}{children}</label>;
}

function ReadField({ label, value }: { label: string; value: string }) {
  return <label className="grid gap-2 text-sm font-black">{label}<input readOnly value={value} className="field bg-white" /></label>;
}

function ReadArea({ label, value, wide = false, dir }: { label: string; value: string; wide?: boolean; dir?: "ltr" | "rtl" }) {
  return <label className={`grid gap-2 text-sm font-black ${wide ? "md:col-span-2" : ""}`}>{label}<textarea readOnly value={value} rows={value ? 3 : 2} dir={dir} className={`field bg-white ${dir === "ltr" ? "text-left" : ""}`} /></label>;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-500">{label}</p><div className="mt-1 font-black">{value}</div></div>;
}
