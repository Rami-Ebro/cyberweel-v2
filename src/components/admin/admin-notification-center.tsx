"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AdminNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string;
  kind: string;
  readAt: string | null;
  createdAt: string;
};

export function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;

    function closeOutside(event: PointerEvent) {
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) setOpen(false);
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  async function openNotification(notification: AdminNotification) {
    if (!notification.readAt) {
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt } : item));
      setUnread((value) => Math.max(0, value - 1));
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id }),
      });
    }
    setOpen(false);
    const fallbackByKind: Record<string, string> = {
      PARTNER_APPLICATION: "/admin/partners?section=partners",
      PARTNER_ACCEPTED: "/admin/partners?section=partners",
      PARTNER_REJECTED: "/admin/partners?section=partners",
      AMBASSADOR_APPLICATION: "/admin/ambassadors",
      AMBASSADOR_ACCEPTED: "/admin/ambassadors",
      AMBASSADOR_REJECTED: "/admin/ambassadors",
      CLIENT_SUBMISSION: "/admin/clients",
    };
    const target = notification.href?.startsWith("/") && !notification.href.startsWith("//")
      ? notification.href
      : fallbackByKind[notification.kind] || "/admin/partners?section=overview";
    window.location.assign(target);
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })));
    setUnread(0);
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  return (
    <div ref={centerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D8D2C4] bg-white shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8] dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        aria-label="إشعارات الإدارة"
        aria-expanded={open}
        title="إشعارات الإدارة"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[min(92vw,420px)] rounded-2xl border border-[#D8D2C4] bg-white p-3 text-[#111827] shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEE7DA] px-2 pb-3 dark:border-slate-800">
            <div><strong>إشعارات الإدارة</strong><p className="text-xs text-slate-500 dark:text-slate-400">{unread} غير مقروء</p></div>
            <button type="button" onClick={() => void markAllRead()} disabled={!unread} className="text-xs font-bold text-[#9A7D43] disabled:opacity-40">تحديد الكل كمقروء</button>
          </div>
          <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">
            {notifications.map((notification) => (
              <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`w-full rounded-xl p-3 text-right transition ${notification.readAt ? "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-amber-50 text-[#111827] dark:bg-amber-950/30 dark:text-amber-100"}`}>
                <div className="flex items-start justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600" />}</div>
                {notification.body && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.body}</p>}
                <p className="mt-2 text-[11px] font-black text-[#9A7D43]">فتح التفاصيل ←</p>
              </button>
            ))}
            {!notifications.length && <p className="p-5 text-center text-sm text-slate-500 dark:text-slate-400">لا توجد إشعارات بعد.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
