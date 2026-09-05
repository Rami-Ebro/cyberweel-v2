"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/admin/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setNotifications(data.notifications || []);
    setUnread(data.unread || 0);
  }, []);

  useEffect(() => {
    const refresh = () => void loadNotifications();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };

    void loadNotifications();
    const intervalId = window.setInterval(refreshWhenVisible, 25_000);
    window.addEventListener("admin-notifications-refresh", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("admin-notifications-refresh", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;

    const targetIsInside = (target: Node) =>
      centerRef.current?.contains(target)
      || mobilePanelRef.current?.contains(target)
      || desktopPanelRef.current?.contains(target);

    function closeOutside(event: PointerEvent) {
      if (!targetIsInside(event.target as Node)) setOpen(false);
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
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
      REFERRAL_CREATED: "/admin/referrals",
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

  const panelContent = (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#EEE7DA] px-2 pb-3 dark:border-slate-800">
        <div><strong>إشعارات الإدارة</strong><p className="text-xs text-slate-500 dark:text-slate-400">{unread} غير مقروء</p></div>
        <button type="button" onClick={() => void markAllRead()} disabled={!unread} className="text-xs font-bold text-[#9A7D43] disabled:opacity-40">تحديد الكل كمقروء</button>
      </div>
      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain sm:max-h-96">
        {notifications.map((notification) => (
          <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`w-full rounded-xl p-3 text-right transition ${notification.readAt ? "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-amber-50 text-[#111827] dark:bg-amber-950/30 dark:text-amber-100"}`}>
            <div className="flex items-start justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600" />}</div>
            {notification.body && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{notification.body}</p>}
            <p className="mt-2 text-[11px] font-black text-[#9A7D43]">فتح التفاصيل ←</p>
          </button>
        ))}
        {!notifications.length && <p className="p-5 text-center text-sm text-slate-500 dark:text-slate-400">لا توجد إشعارات بعد.</p>}
      </div>
    </>
  );

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
        <>
          {typeof document !== "undefined" && createPortal(
            <div ref={mobilePanelRef} className="fixed inset-x-3 bottom-3 z-[100] flex max-h-[68dvh] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white p-3 text-[#111827] shadow-2xl sm:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              {panelContent}
            </div>,
            document.body,
          )}
          <div ref={desktopPanelRef} className="absolute left-0 top-[calc(100%+10px)] z-50 hidden w-[min(92vw,420px)] flex-col overflow-hidden rounded-2xl border border-[#D8D2C4] bg-white p-3 text-[#111827] shadow-2xl sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            {panelContent}
          </div>
        </>
      )}
    </div>
  );
}
