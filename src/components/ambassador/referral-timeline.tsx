"use client";

import { Calendar, Clock, CheckCircle2, ArrowRight } from "lucide-react";

type ReferralTimelineProps = {
  referral: {
    id: string;
    name: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    convertedAt: string | null;
  };
};

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("ar-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReferralTimeline({ referral }: ReferralTimelineProps) {
  const events = [
    {
      icon: Calendar,
      label: "تم إنشاء الإحالة",
      date: referral.createdAt,
      format: formatDateTime,
    },
    {
      icon: Clock,
      label: "آخر تحديث",
      date: referral.updatedAt,
      format: formatDateTime,
    },
    ...(referral.convertedAt
      ? [
          {
            icon: CheckCircle2,
            label: "تحولت إلى عميل",
            date: referral.convertedAt,
            format: formatDate,
          },
        ]
      : []),
    {
      icon: ArrowRight,
      label: "الحالة الحالية",
      date: referral.status,
      format: (v) => v,
      isStatus: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h4 className="text-sm font-black text-[#9f7d3d] mb-4">سجل النشاط</h4>
      <div className="relative">
        <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-6 pl-12">
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            return (
              <div key={index} className="relative">
                <div className="absolute right-[-12px] top-0 w-2.5 h-2.5 rounded-full border-2 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 z-10" />
                {!isLast && (
                  <div className="absolute right-[-10px] top-[6px] bottom-[6px] w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}
                <div className="min-h-[36px]">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400">{event.label}</p>
                  {event.isStatus ? (
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
                      {event.format(event.date)}
                    </span>
                  ) : (
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{event.format(event.date)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}