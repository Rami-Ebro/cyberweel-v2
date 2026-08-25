"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCircle2, RefreshCw } from "lucide-react";

type PartnerProject = {
  id: string;
  title: string;
  status: string;
  paymentStatus: "PENDING" | "APPROVED" | "PAID" | "CANCELLED";
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  updates: string[];
  feeAmount: string | null;
  feeCurrency: string;
};

type DashboardPayload = {
  projects?: PartnerProject[];
};

type PartnerNotification = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
};

const SEEN_KEY = "cyberweel-partner-notifications-seen-at";

function updateNotification(project: PartnerProject, value: string, index: number): PartnerNotification {
  const separator = value.indexOf(" — ");
  const timestamp = separator > 0 ? value.slice(0, separator) : project.updatedAt;
  const body = separator > 0 ? value.slice(separator + 3) : value;
  return {
    id: `${project.id}-update-${index}-${timestamp}`,
    title: project.title,
    body,
    timestamp,
  };
}

function buildNotifications(projects: PartnerProject[]) {
  const items: PartnerNotification[] = [];

  for (const project of projects) {
    project.updates.forEach((value, index) => items.push(updateNotification(project, value, index)));

    if (project.paymentStatus === "PAID" && project.paidAt) {
      items.push({
        id: `${project.id}-paid-${project.paidAt}`,
        title: "تم دفع مستحقك",
        body: `${project.title}${project.feeAmount ? ` — ${project.feeAmount} ${project.feeCurrency}` : ""}`,
        timestamp: project.paidAt,
      });
    } else if (project.paymentStatus === "APPROVED" && project.approvedAt) {
      items.push({
        id: `${project.id}-due-${project.approvedAt}`,
        title: "أصبح مستحقك جاهزًا للدفع",
        body: `${project.title}${project.feeAmount ? ` — ${project.feeAmount} ${project.feeCurrency}` : ""}`,
        timestamp: project.approvedAt,
      });
    }

    if (!project.updates.length && ["ASSIGNED", "IN_PROGRESS"].includes(project.status)) {
      items.push({
        id: `${project.id}-assigned-${project.createdAt}`,
        title: "تم إسناد عمل جديد إليك",
        body: project.title,
        timestamp: project.createdAt,
      });
    }
  }

  return items
    .filter((item) => !Number.isNaN(Date.parse(item.timestamp)))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 12);
}

function displayDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "";
  }
}

export function PartnerHeaderTools() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [projects, setProjects] = useState<PartnerProject[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    setSeenAt(Date.parse(localStorage.getItem(SEEN_KEY) || "") || 0);

    const attach = () => {
      const header = document.querySelector("main header");
      if (!header) return;
      const groups = Array.from(header.querySelectorAll<HTMLElement>("div.flex.items-center.gap-2"));
      const candidate = groups[groups.length - 1] || null;
      if (candidate) setTarget(candidate);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const previewId = new URLSearchParams(window.location.search).get("adminPreview");
      const endpoint = previewId
        ? `/api/partner/dashboard?adminPreview=${encodeURIComponent(previewId)}`
        : "/api/partner/dashboard";
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as DashboardPayload | null;
      if (response.ok) setProjects(payload?.projects || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const notifications = useMemo(() => buildNotifications(projects), [projects]);
  const unread = notifications.filter((item) => Date.parse(item.timestamp) > seenAt).length;

  function toggleNotifications() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        void loadNotifications();
        const now = Date.now();
        setSeenAt(now);
        localStorage.setItem(SEEN_KEY, new Date(now).toISOString());
      }
      return next;
    });
  }

  function refreshDashboard() {
    setRefreshing(true);
    window.setTimeout(() => window.location.reload(), 120);
  }

  if (!target) return null;

  return createPortal(
    <>
      <div className="relative">
        <button
          type="button"
          aria-label="تنبيهات الشريك"
          aria-expanded={open}
          onClick={toggleNotifications}
          className="relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-[#bd9850] dark:border-slate-700 dark:bg-slate-900"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+10px)] z-[80] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="font-black">تنبيهات الشريك</p>
                <p className="mt-0.5 text-xs text-slate-500">آخر قرارات الإدارة والدفع والتسليم</p>
              </div>
              <button type="button" onClick={() => void loadNotifications()} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800" aria-label="تحديث التنبيهات">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {loading && !notifications.length ? (
                <p className="p-5 text-center text-sm text-slate-500">جارٍ تحميل التنبيهات...</p>
              ) : notifications.length ? notifications.map((item) => (
                <div key={item.id} className="rounded-xl px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#bd9850]" />
                    <div className="min-w-0">
                      <p className="font-black">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{displayDate(item.timestamp)}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="p-5 text-center text-sm text-slate-500">لا توجد تنبيهات حتى الآن.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={refreshDashboard}
        disabled={refreshing}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-black shadow-sm transition hover:border-[#bd9850] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
      >
        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        <span className="hidden md:inline">تحديث</span>
      </button>
    </>,
    target,
  );
}
