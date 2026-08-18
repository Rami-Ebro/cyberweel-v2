"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function AdminPartnersLayout({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const showExecutionPlan = section === "projects";

  return (
    <>
      {children}
      {showExecutionPlan && (
        <Link
          href="/admin/execution-plan"
          className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-2xl border border-[#B89A5A] bg-[#111827] px-5 py-3.5 font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89A5A] focus-visible:ring-offset-2"
        >
          <ClipboardList className="h-5 w-5" />
          خطة التنفيذ
        </Link>
      )}
    </>
  );
}
