"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  BarChart3, BadgeDollarSign, CheckCircle2, FolderKanban, Home, Link2, LogOut,
  Moon, ReceiptText, RefreshCw, ShieldCheck, Sun, UserCog, UserRound, UsersRound, History,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";
import { DashboardLanguageButton } from "@/components/dashboard-i18n-provider";

export type AdminNavKey = "overview" | "clients" | "projects" | "invoices" | "referrals" | "rewards" | "partners" | "ambassadors" | "account" | "team" | "smart-links" | "audit-log";

type AdminNavItem = { key: AdminNavKey; label: string; href: string; icon: typeof BarChart3 };

const items: AdminNavItem[] = [
  { key: "overview", label: "نظرة عامة", href: "/admin/partners?section=overview", icon: BarChart3 },
  { key: "clients", label: "العملاء", href: "/admin/clients", icon: UserRound },
  { key: "projects", label: "المشاريع", href: "/admin/partners?section=projects", icon: FolderKanban },
  { key: "invoices", label: "الفواتير", href: "/admin/invoices", icon: ReceiptText },
  { key: "referrals", label: "الإحالات", href: "/admin/referrals", icon: CheckCircle2 },
  { key: "partners", label: "الشركاء", href: "/admin/partners?section=partners", icon: UsersRound },
  { key: "ambassadors", label: "السفراء", href: "/admin/ambassadors", icon: UsersRound },
  { key: "account", label: "حساب الإدارة", href: "/admin/partners?section=account", icon: UserCog },
  { key: "team", label: "إدارة الفريق والصلاحيات", href: "/admin/team", icon: ShieldCheck },
  { key: "audit-log", label: "سجل النشاطات", href: "/admin/audit-log", icon: History },
  { key: "smart-links", label: "الروابط الذكية", href: "/admin/smart-links", icon: Link2 },
];

const ADMIN_THEME_KEY = "cyberweel-admin-theme";

export function AdminShell({ active, eyebrow = "مركز التحكم", title, description, actions, children, wide = true }: {
  active: AdminNavKey; eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  const router = useRouter();
  const ambassadorSectionActive = active === "ambassadors" || active === "rewards";
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setDarkMode(localStorage.getItem(ADMIN_THEME_KEY) === "dark"));
  }, []);

  function toggleDarkMode() {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem(ADMIN_THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }

  function refreshDashboard() {
    setRefreshing(true);
    window.dispatchEvent(new Event("admin-notifications-refresh"));
    window.setTimeout(() => window.location.reload(), 120);
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/partner/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <main
      dir="rtl"
      data-admin-shell-root="true"
      className={darkMode ? "dark min-h-screen bg-slate-950 text-white" : "min-h-screen bg-[#F7F3EB] text-[#111827]"}
    >
      <div className="grid min-h-screen lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="flex flex-col bg-[#111827] p-5 text-white lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:overflow-hidden">
          <Link href="/" className="flex shrink-0 items-center gap-3 border-b border-white/10 pb-5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
            <span><span className="block font-black">CyberWeel</span><span className="text-xs text-white/50">لوحة الإدارة</span></span>
          </Link>
          <nav
            aria-label="القائمة الرئيسية للوحة الإدارة"
            data-admin-nav-scroll
            className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-h-0 lg:flex-1 lg:grid-cols-1 lg:overflow-y-auto lg:overscroll-contain lg:pe-2"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const selected = item.key === "ambassadors" ? ambassadorSectionActive : item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={selected ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-bold transition ${selected ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto grid shrink-0 gap-2 pt-8 lg:pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-xl bg-[#B89A5A] px-4 py-3 font-black text-[#111827]"><Home className="h-5 w-5" />العودة إلى الموقع</Link>
          </div>
        </aside>
        <section className="min-w-0 p-4 sm:p-7 lg:p-10">
          <div className={wide ? "mx-auto max-w-[1500px]" : "mx-auto max-w-6xl"}>
            <header className="sticky top-0 z-30 -mx-4 flex flex-col gap-4 border-b border-[#D8D2C4]/80 bg-[#F7F3EB]/95 px-4 py-4 backdrop-blur sm:-mx-7 sm:flex-row sm:items-start sm:justify-between sm:px-7 lg:-mx-10 lg:px-10 dark:border-slate-800 dark:bg-slate-950/95">
              <div><p className="text-sm font-bold text-[#9A7D43]">{eyebrow}</p><h1 className="mt-1 text-3xl font-black">{title}</h1>{description && <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">{description}</p>}</div>
              <div className="relative flex flex-wrap items-center justify-end gap-2">
                <AdminNotificationCenter />
                <button
                  type="button"
                  onClick={refreshDashboard}
                  disabled={refreshing}
                  aria-label="تحديث لوحة الإدارة"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-3 font-black shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                  <span className="hidden md:inline">تحديث</span>
                </button>
                <DashboardLanguageButton />
                <button
                  type="button"
                  aria-label="تبديل المظهر"
                  title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}
                  onClick={toggleDarkMode}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D8D2C4] bg-white shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8] dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  aria-label="تسجيل الخروج"
                  className="inline-flex h-11 w-11 items-center justify-center gap-2 rounded-xl bg-rose-600 font-black text-white transition hover:bg-rose-700 disabled:opacity-60 sm:w-auto sm:px-4"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">{loggingOut ? "جارٍ الخروج" : "تسجيل الخروج"}</span>
                </button>
                {actions}
              </div>
            </header>

            {ambassadorSectionActive && (
              <nav aria-label="مركز السفراء" className="mt-6 inline-flex flex-wrap gap-2 rounded-2xl border border-[#D8D2C4] bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <Link
                  href="/admin/ambassadors"
                  aria-current={active === "ambassadors" ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === "ambassadors" ? "bg-[#111827] text-white dark:bg-[#B89A5A] dark:text-[#111827]" : "text-slate-600 hover:bg-[#F7F3EB] dark:text-slate-300 dark:hover:bg-slate-800"}`}
                >
                  <UserRound className="h-4 w-4" />
                  إدارة السفراء
                </Link>
                <Link
                  href="/admin/rewards"
                  aria-current={active === "rewards" ? "page" : undefined}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${active === "rewards" ? "bg-[#111827] text-white dark:bg-[#B89A5A] dark:text-[#111827]" : "text-slate-600 hover:bg-[#F7F3EB] dark:text-slate-300 dark:hover:bg-slate-800"}`}
                >
                  <BadgeDollarSign className="h-4 w-4" />
                  مكافآت السفراء
                </Link>
              </nav>
            )}

            {children}
          </div>
        </section>
      </div>
      <style jsx global>{`
        [data-admin-nav-scroll] {
          scrollbar-color: #b89a5a transparent;
          scrollbar-width: thin;
        }
        [data-admin-nav-scroll]::-webkit-scrollbar {
          width: 6px;
        }
        [data-admin-nav-scroll]::-webkit-scrollbar-track {
          background: transparent;
        }
        [data-admin-nav-scroll]::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #b89a5a;
        }

        [data-admin-shell-root="true"].dark > div > section {
          background: #020617;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-white"] {
          background-color: #0f172a !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-slate-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-slate-100"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#F7F3EB]"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#FFFDF8]"] {
          background-color: #111827 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-slate-100"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-slate-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#D8D2C4]"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#EEE7DA]"] {
          border-color: #334155 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-[#111827]"] {
          color: #f8fafc !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-slate-500"] {
          color: #94a3b8 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-slate-600"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-slate-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-slate-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-slate-900"] {
          color: #cbd5e1 !important;
        }
        [data-admin-shell-root="true"].dark > div > section input,
        [data-admin-shell-root="true"].dark > div > section select,
        [data-admin-shell-root="true"].dark > div > section textarea {
          border-color: #334155 !important;
          background: #0f172a !important;
          color: #f8fafc !important;
          color-scheme: dark;
        }
      `}</style>
    </main>
  );
}
