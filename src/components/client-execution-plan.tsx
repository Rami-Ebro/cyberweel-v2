"use client";

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

export function ClientExecutionPlan({ stages }: { stages: ClientProjectStage[] }) {
  if (!stages.length) return null;

  const currentIndex = stages.findIndex((stage) => !["COMPLETED", "CANCELLED"].includes(stage.status));
  const highlightedIndex = currentIndex === -1 ? stages.length - 1 : currentIndex;

  return (
    <details className="group mt-4 rounded-2xl border border-[#D8D2C4] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-[#9A7D43]">
        <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />خطة التنفيذ</span>
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>

      <div className="grid gap-3 border-t border-[#EEE7DA] p-4">
        {stages.map((stage, index) => {
          const highlighted = index === highlightedIndex;
          return (
            <article key={stage.id} className={`rounded-2xl border p-4 ${highlighted ? "border-[#B89A5A] bg-[#FFF9EA] shadow-sm" : "border-[#E6E0D4] bg-[#FCFAF6]"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#9A7D43]">المرحلة {index + 1}</p>
                  <h4 className="mt-1 text-base font-black">{stage.name}</h4>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-white px-3 py-1.5">{stageStatusLabel[stage.status] || stage.status}</span>
                  <span className="rounded-full bg-white px-3 py-1.5">{paymentStatusLabel[stage.paymentStatus] || stage.paymentStatus}</span>
                </div>
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

function PlanFact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs font-bold text-slate-500">{label}</p><div className="mt-1 font-black">{value}</div></div>;
}
