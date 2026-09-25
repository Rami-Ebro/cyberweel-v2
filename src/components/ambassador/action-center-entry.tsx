"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";

/** Visible bridge from the legacy ambassador dashboard to Workspace V2. */
export function AmbassadorActionCenterEntry() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("adminPreview");
  const href = previewId
    ? `/ambassador/action-center?adminPreview=${encodeURIComponent(previewId)}`
    : "/ambassador/action-center";

  return (
    <div dir="rtl" className="fixed bottom-5 right-5 z-[70] sm:bottom-7 sm:right-7">
      <Link
        href={href}
        aria-label="فتح مركز عمل السفير الجديد"
        className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c49b] bg-[#111827] px-4 py-3 text-sm font-black text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89A5A] focus-visible:ring-offset-2 sm:px-5"
      >
        <Sparkles size={18} className="text-[#D8B86A]" />
        <span>مركز العمل الجديد</span>
        <span className="rounded-full bg-[#B89A5A] px-2 py-0.5 text-[10px] font-black text-slate-950">V2</span>
      </Link>
    </div>
  );
}
