"use client";

import type { ReactNode } from "react";
import { ChevronDown, ClipboardList } from "lucide-react";
import { DateText } from "@/components/ui/date-text";

export type ClientProjectStage = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  dueAt: string | null;
  completedAt: string | null;
  paidAt: string | null;
  projectProgress?: number;
  projectStatus?: string;
  plannedTotal?: number;
};

const stageStatusLabel: Record<string, string> = {
  NOT_STARTED: "لم تبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};
const paymentStatusLabel: Record<string, string> = {
  PENDING: "بانتظار الدفع",
  PAID: "مدفوعة",
  CANCELLED: "ملغاة",
};
const projectStatusLabel: Record<string, string> = {
  PLANNING: "التخطيط",
  IN_PROGRESS: "قيد التنفيذ",
  REVIEW: "المراجعة",
  COMPLETED: "مكتمل",
  ON_HOLD: "متوقف مؤقتًا",
  CANCELLED: "ملغى",
};

export function ClientExecutionPlan({ stages }: { stages: ClientProjectStage[] }) {
  if (!stages.length) return null;

  const currentIndex = stages.findIndex((stage) => !["COMPLETED", "CANCELLED"].includes(stage.status));
  const highlightedIndex = currentIndex === -1 ? stages.length - 1 : currentIndex;
  const progress = Math.max(0, Math.min(100, stages[0]?.projectProgress || 0));
  const paidAmount = stages.filter((stage) => stage.paymentStatus === "PAID").reduce((sum, stage) => sum + stage.amount, 0);
  const plannedTotal = stages[0]?.plannedTotal || stages.reduce((sum, stage) => sum + stage.amount, 0);
  const financialProgress = plannedTotal > 0 ? Math.min(100, Math.round((paidAmount / plannedTotal) * 100)) : 0;
  const completedStages = stages.filter((stage) => stage.status === "COMPLETED").length;
  const currentStage = stages[currentIndex === -1 ? stages.length - 1 : currentIndex];

  return (
    <details className="group mt-4 rounded-2xl border border-[#D8D2C4] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-[#9A7D43]">
        <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />خطة التنفيذ</span>
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-4 border-t border-[#EEE7DA] p-4">
        <section className="grid gap-4 rounded-2xl border border-[#E6E0D4] bg-[#FCFAF6] p-4 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-3"><strong>تقدم التنفيذ</strong><span className="text-2xl font-black text-[#9A7D43]">{progress}%</span></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#B89A5A]" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <PlanFact label="المرحلة الحالية" value={currentStage?.name || "—"} />
              <PlanFact label="المكتمل" value={`${completedStages} من ${stages.length}`} />
              <PlanFact label="حالة المشروع" value={projectStatusLabel[stages[0]?.projectStatus || ""] || stages[0]?.projectStatus || "—"} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3"><strong>التقدم المالي</strong><span className="text-2xl font-black text-[#9A7D43]">{financialProgress}%</span></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#B89A5A]" style={{ width: `${financialProgress}%` }} /></div>
            <p className="mt-3 text-sm font-bold text-slate-600">المدفوع {paidAmount.toLocaleString("ar")} من {plannedTotal.toLocaleString("ar")} {stages[0]?.currency}</p>
          </div>
        </section>

        {stages.map((stage, index) => {
          const highlighted = index === highlightedIndex;
          return (
            <article key={stage.id} className={`rounded-2xl border p-4 ${highlighted ? "border-[#B89A5A] bg-[#FFF9EA] shadow-sm" : "border-[#E6E0D4] bg-[#FCFAF6]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-black text-[#9A7D43]">المرحلة {index + 1}</p><h4 className="mt-1 text-base font-black">{stage.name}</h4></div>
                <div className="flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-white px-3 py-1.5">{stageStatusLabel[stage.status] || stage.status}</span><span className="rounded-full bg-white px-3 py-1.5">{paymentStatusLabel[stage.paymentStatus] || stage.paymentStatus}</span></div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <PlanFact label="المبلغ" value={`${stage.amount.toLocaleString("ar")} ${stage.currency}`} />
                <PlanFact label="حالة الدفع" value={paymentStatusLabel[stage.paymentStatus] || stage.paymentStatus} />
                <PlanFact label="تاريخ استحقاق الدفع" value={<DateText value={stage.dueAt} fallback="غير محدد" />} />
              </div>
            </article>
          );
        })}
      </div>
    </details>
  );
}

function PlanFact({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-500">{label}</p><div className="mt-1 font-black">{value}</div></div>;
}
