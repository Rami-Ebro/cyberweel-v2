"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function AdminNotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

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
    router.push(notification.href);
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
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 font-bold shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8]" aria-label="إشعارات الإدارة" aria-expanded={open}>
        <Bell className="h-5 w-5" />
        <span>الإشعارات</span>
        {unread > 0 && <span className="absolute -left-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-black text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-14 z-50 w-[min(92vw,420px)] rounded-2xl border border-[#D8D2C4] bg-white p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEE7DA] px-2 pb-3">
            <div><strong>إشعارات الإدارة</strong><p className="text-xs text-slate-500">{unread} غير مقروء</p></div>
            <button type="button" onClick={() => void markAllRead()} disabled={!unread} className="text-xs font-bold text-[#9A7D43] disabled:opacity-40">تحديد الكل كمقروء</button>
          </div>
          <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">
            {notifications.map((notification) => (
              <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`w-full rounded-xl p-3 text-right ${notification.readAt ? "bg-slate-50 text-slate-600" : "bg-amber-50 text-[#111827]"}`}>
                <div className="flex items-start justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600" />}</div>
                {notification.body && <p className="mt-1 text-xs text-slate-500">{notification.body}</p>}
              </button>
            ))}
            {!notifications.length && <p className="p-5 text-center text-sm text-slate-500">لا توجد إشعارات بعد.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
