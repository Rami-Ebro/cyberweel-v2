"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Bell, CheckCircle2, FolderKanban, Home, Link2, LogOut,
  ReceiptText, ShieldCheck, UserCog, UserRound, UsersRound,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

export type AdminNavKey = "overview" | "clients" | "projects" | "invoices" | "referrals" | "partners" | "ambassadors" | "account" | "team" | "smart-links";

const items: Array<{ key: AdminNavKey; label: string; href: string; icon: typeof BarChart3 }> = [
  { key: "overview", label: "نظرة عامة", href: "/admin/partners?section=overview", icon: BarChart3 },
  { key: "clients", label: "العملاء", href: "/admin/clients", icon: UserRound },
  { key: "projects", label: "المشاريع", href: "/admin/partners?section=projects", icon: FolderKanban },
  { key: "invoices", label: "الفواتير", href: "/admin/invoices", icon: ReceiptText },
  { key: "referrals", label: "الإحالات", href: "/admin/referrals", icon: CheckCircle2 },
  { key: "partners", label: "الشركاء", href: "/admin/partners?section=partners", icon: UsersRound },
  { key: "ambassadors", label: "السفراء", href: "/admin/ambassadors", icon: UsersRound },
  { key: "account", label: "حساب الإدارة", href: "/admin/partners?section=account", icon: UserCog },
  { key: "team", label: "إدارة الفريق والصلاحيات", href: "/admin/team", icon: ShieldCheck },
  { key: "smart-links", label: "الروابط الذكية", href: "/admin/smart-links", icon: Link2 },
];

export function AdminShell({ active, eyebrow = "مركز التحكم", title, description, actions, children, wide = true }: {
  active: AdminNavKey; eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string | null; href: string; readAt: string | null; createdAt: string }>>([]);
  const [unread, setUnread] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  async function loadNotifications() {
    const response = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setNotifications(data.notifications || []);
    setUnread(data.unread || 0);
  }
  useEffect(() => {
    const refresh = () => void loadNotifications();
    void Promise.resolve().then(loadNotifications);
    window.addEventListener("admin-notifications-refresh", refresh);
    return () => window.removeEventListener("admin-notifications-refresh", refresh);
  }, []);

  async function openNotification(id: string, href: string) {
    const item = notifications.find((notification) => notification.id === id);
    if (item && !item.readAt) {
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, readAt } : notification));
      setUnread((value) => Math.max(0, value - 1));
      await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    }
    setNotificationsOpen(false);
    router.push(href);
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })));
    setUnread(0);
    await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }
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
                <button type="button" onClick={() => setNotificationsOpen((value) => !value)} className="relative grid h-12 w-12 place-items-center rounded-xl border border-[#D8D2C4] bg-white shadow-sm" aria-label="إشعارات الإدارة"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute -left-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-black text-white">{unread > 99 ? "99+" : unread}</span>}</button>
                {actions}
                {notificationsOpen && <div className="absolute left-0 top-14 z-50 w-[min(92vw,420px)] rounded-2xl border border-[#D8D2C4] bg-white p-3 shadow-2xl"><div className="flex items-center justify-between gap-3 border-b border-[#EEE7DA] px-2 pb-3"><div><strong>إشعارات الإدارة</strong><p className="text-xs text-slate-500">{unread} غير مقروء</p></div><button type="button" onClick={() => void markAllRead()} disabled={!unread} className="text-xs font-bold text-[#9A7D43] disabled:opacity-40">تحديد الكل كمقروء</button></div><div className="mt-2 max-h-96 space-y-2 overflow-y-auto">{notifications.map((notification) => <button key={notification.id} type="button" onClick={() => void openNotification(notification.id, notification.href)} className={`w-full rounded-xl p-3 text-right ${notification.readAt ? "bg-slate-50 text-slate-600" : "bg-amber-50 text-[#111827]"}`}><div className="flex items-start justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600" />}</div>{notification.body && <p className="mt-1 text-xs text-slate-500">{notification.body}</p>}</button>)}{!notifications.length && <p className="p-5 text-center text-sm text-slate-500">لا توجد إشعارات بعد.</p>}</div></div>}
              </div>
            </header>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
