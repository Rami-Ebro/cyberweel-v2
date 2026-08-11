"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import {
  BarChart3, CheckCircle2, FolderKanban, Home, Link2, LogOut,
  ReceiptText, ShieldCheck, UserCog, UserRound, UsersRound, History, BadgeDollarSign,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";

export type AdminNavKey = "overview" | "clients" | "projects" | "invoices" | "referrals" | "rewards" | "partners" | "ambassadors" | "account" | "team" | "smart-links" | "audit-log";

const items: Array<{ key: AdminNavKey; label: string; href: string; icon: typeof BarChart3 }> = [
  { key: "overview", label: "نظرة عامة", href: "/admin/partners?section=overview", icon: BarChart3 },
  { key: "clients", label: "العملاء", href: "/admin/clients", icon: UserRound },
  { key: "projects", label: "المشاريع", href: "/admin/partners?section=projects", icon: FolderKanban },
  { key: "invoices", label: "الفواتير", href: "/admin/invoices", icon: ReceiptText },
  { key: "referrals", label: "الإحالات", href: "/admin/referrals", icon: CheckCircle2 },
  { key: "rewards", label: "مكافآت السفراء", href: "/admin/rewards", icon: BadgeDollarSign },
  { key: "partners", label: "الشركاء", href: "/admin/partners?section=partners", icon: UsersRound },
  { key: "ambassadors", label: "السفراء", href: "/admin/ambassadors", icon: UsersRound },
  { key: "account", label: "حساب الإدارة", href: "/admin/partners?section=account", icon: UserCog },
  { key: "team", label: "إدارة الفريق والصلاحيات", href: "/admin/team", icon: ShieldCheck },
  { key: "audit-log", label: "سجل النشاطات", href: "/admin/audit-log", icon: History },
  { key: "smart-links", label: "الروابط الذكية", href: "/admin/smart-links", icon: Link2 },
];

export function AdminShell({ active, eyebrow = "مركز التحكم", title, description, actions, children, wide = true }: {
  active: AdminNavKey; eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/partner/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="grid min-h-screen lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="flex flex-col bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <Link href="/" className="flex items-center gap-3 border-b border-white/10 pb-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
            <span><span className="block font-black">CyberWeel</span><span className="text-xs text-white/50">لوحة الإدارة</span></span>
          </Link>
          <nav aria-label="القائمة الرئيسية للوحة الإدارة" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {items.map((item) => {
              const Icon = item.icon;
              const selected = item.key === active;
              return <Link key={item.key} href={item.href} aria-current={selected ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-bold transition ${selected ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5 shrink-0" />{item.label}</Link>;
            })}
          </nav>
          <div className="mt-auto grid gap-2 pt-8">
            <Link href="/" className="flex items-center gap-3 rounded-xl bg-[#B89A5A] px-4 py-3 font-black text-[#111827]"><Home className="h-5 w-5" />العودة إلى الموقع</Link>
            <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/70 hover:bg-white/10"><LogOut className="h-5 w-5" />تسجيل الخروج</button>
          </div>
        </aside>
        <section className="min-w-0 p-4 sm:p-7 lg:p-10">
          <div className={wide ? "mx-auto max-w-[1500px]" : "mx-auto max-w-6xl"}>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-sm font-bold text-[#9A7D43]">{eyebrow}</p><h1 className="mt-1 text-3xl font-black">{title}</h1>{description && <p className="mt-2 max-w-3xl text-slate-500">{description}</p>}</div>
              <div className="relative flex flex-wrap gap-2">
                <AdminNotificationCenter />
                {actions}
              </div>
            </header>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
