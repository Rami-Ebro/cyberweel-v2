"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  BarChart3, BadgeDollarSign, CheckCircle2, FolderKanban, Home, Link2, LogOut, Menu,
  Moon, ReceiptText, RefreshCw, ShieldCheck, Sun, UserCog, UserRound, UsersRound, History, X,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopSidebar, setDesktopSidebar] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setDarkMode(window.localStorage.getItem(ADMIN_THEME_KEY) === "dark");
      } catch {
        setDarkMode(false);
      }
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setDesktopSidebar(media.matches);
      if (media.matches) setMenuOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!menuOpen || desktopSidebar) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, desktopSidebar]);

  function toggleDarkMode() {
    setDarkMode((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(ADMIN_THEME_KEY, next ? "dark" : "light");
      } catch {
        // The visual toggle must keep working even when browser storage is unavailable.
      }
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
        {menuOpen && <button type="button" aria-label="إغلاق قائمة الإدارة" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden" />}
        <aside
          inert={!desktopSidebar && !menuOpen}
          aria-hidden={!desktopSidebar && !menuOpen ? true : undefined}
          className={`fixed inset-y-0 right-0 z-50 flex w-[min(290px,calc(100vw-1rem))] flex-col overflow-y-auto overscroll-contain bg-[#111827] p-5 text-white shadow-2xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 pb-5">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white"><Logo size={36} /></span>
              <span><span className="block font-black">CyberWeel</span><span className="text-xs text-white/50">لوحة الإدارة</span></span>
            </Link>
            <button type="button" aria-label="إغلاق قائمة الإدارة" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-white/70 hover:bg-white/10 lg:hidden"><X size={22} /></button>
          </div>
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
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-bold transition ${selected ? "bg-[#B89A5A] text-[#111827]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto grid shrink-0 gap-2 pt-8 lg:pt-4">
            <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl bg-[#B89A5A] px-4 py-3 font-black text-[#111827]"><Home className="h-5 w-5" />العودة إلى الموقع</Link>
          </div>
        </aside>
        <section className="min-w-0 p-4 sm:p-7 lg:p-10">
          <div className={wide ? "mx-auto max-w-[1500px]" : "mx-auto max-w-6xl"}>
            <header className="sticky top-0 z-30 -mx-4 flex flex-col gap-4 border-b border-[#D8D2C4]/80 bg-[#F7F3EB]/95 px-4 py-4 backdrop-blur sm:-mx-7 sm:flex-row sm:items-start sm:justify-between sm:px-7 lg:-mx-10 lg:px-10 dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex min-w-0 items-start gap-3">
                <button type="button" aria-label="فتح قائمة الإدارة" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D8D2C4] bg-white shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-900"><Menu size={20} /></button>
                <div className="min-w-0"><p className="text-sm font-bold text-[#9A7D43]">{eyebrow}</p><h1 className="mt-1 break-words text-2xl font-black sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">{description}</p>}</div>
              </div>
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
        [data-admin-shell-root="true"].dark > div > section [class~="bg-white"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-white/95"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-white/80"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-white/70"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-white/60"] {
          background-color: #0f172a !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-slate-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-slate-100"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#F7F3EB]"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#FFFDF8]"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#F3EEE5]"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#F4F1EA]"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#FCFAF6]"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-[#FBF8F2]"] {
          background-color: #111827 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-emerald-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-emerald-100"] {
          background-color: #052e16 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-rose-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-rose-100"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-red-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-red-100"] {
          background-color: #4c0519 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-amber-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-amber-100"] {
          background-color: #451a03 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-sky-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-sky-100"] {
          background-color: #082f49 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-violet-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-violet-100"] {
          background-color: #2e1065 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="bg-teal-50"],
        [data-admin-shell-root="true"].dark > div > section [class~="bg-teal-100"] {
          background-color: #042f2e !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-slate-100"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-slate-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#D8D2C4]"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#E5DED0]"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#E6E0D4]"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#E8E1D5]"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#E2DACB]"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-[#EEE7DA]"] {
          border-color: #334155 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-emerald-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-emerald-300"] {
          border-color: #047857 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-rose-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-rose-300"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-red-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-red-300"] {
          border-color: #be123c !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-amber-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-amber-300"] {
          border-color: #b45309 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-sky-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-sky-300"] {
          border-color: #0369a1 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-violet-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-violet-300"] {
          border-color: #6d28d9 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="border-teal-200"],
        [data-admin-shell-root="true"].dark > div > section [class~="border-teal-300"] {
          border-color: #0f766e !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-[#111827]"] {
          color: #f8fafc !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-[#6F5A32]"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-[#7A6335]"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-[#7B5D26]"] {
          color: #d6bc83 !important;
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
        [data-admin-shell-root="true"].dark > div > section [class~="text-emerald-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-emerald-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-emerald-900"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-emerald-950"] {
          color: #a7f3d0 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-rose-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-rose-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-rose-900"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-rose-950"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-red-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-red-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-red-900"] {
          color: #fecdd3 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-amber-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-amber-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-amber-900"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-amber-950"] {
          color: #fde68a !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-sky-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-sky-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-sky-900"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-sky-950"] {
          color: #bae6fd !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-violet-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-violet-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-violet-900"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-violet-950"] {
          color: #ddd6fe !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="text-teal-700"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-teal-800"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-teal-900"],
        [data-admin-shell-root="true"].dark > div > section [class~="text-teal-950"] {
          color: #99f6e4 !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="ring-emerald-200"] { --tw-ring-color: #047857 !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="ring-rose-200"] { --tw-ring-color: #be123c !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="ring-amber-200"] { --tw-ring-color: #b45309 !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="ring-sky-200"] { --tw-ring-color: #0369a1 !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="ring-violet-200"] { --tw-ring-color: #6d28d9 !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="ring-teal-200"] { --tw-ring-color: #0f766e !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-[#FBF8F2]"]:hover,
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-[#FCFAF6]"]:hover,
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-[#F7F3EB]"]:hover,
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-white"]:hover {
          background-color: #1e293b !important;
        }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-emerald-100"]:hover { background-color: #064e3b !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-rose-100"]:hover,
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-red-100"]:hover { background-color: #881337 !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-amber-100"]:hover { background-color: #78350f !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-sky-100"]:hover { background-color: #0c4a6e !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-violet-100"]:hover { background-color: #4c1d95 !important; }
        [data-admin-shell-root="true"].dark > div > section [class~="hover:bg-teal-100"]:hover { background-color: #134e4a !important; }
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
