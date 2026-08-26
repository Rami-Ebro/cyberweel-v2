"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Bell, CheckCircle2, CheckCheck, RefreshCw } from "lucide-react";

type AmbassadorSection = "overview" | "tools" | "referrals" | "rewards" | "profile";

type AmbassadorReferral = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  updatedAt: string;
};

type AmbassadorReward = {
  id: string;
  amount: string;
  currency: string;
  status: "EXPECTED" | "EARNED" | "PAID" | "CANCELLED";
  earnedAt: string | null;
  paidAt: string | null;
  updatedAt?: string;
  paymentProof?: { paidAt: string } | null;
  project: { title: string };
  projectStage: { name: string };
};

type DashboardPayload = {
  referrals?: AmbassadorReferral[];
  rewards?: AmbassadorReward[];
};

type AmbassadorNotification = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  section: AmbassadorSection;
};

const SEEN_IDS_KEY = "cyberweel-ambassador-notifications-seen-ids";
const SECTION_INDEX: Record<AmbassadorSection, number> = {
  overview: 0,
  tools: 1,
  referrals: 2,
  rewards: 3,
  profile: 4,
};

function validTimestamp(value: string | null | undefined) {
  return value && !Number.isNaN(Date.parse(value)) ? value : null;
}

function buildNotifications(payload: DashboardPayload) {
  const items: AmbassadorNotification[] = [];

  for (const reward of payload.rewards || []) {
    const paidAt = validTimestamp(reward.paymentProof?.paidAt) || validTimestamp(reward.paidAt) || validTimestamp(reward.updatedAt);
    const earnedAt = validTimestamp(reward.earnedAt) || validTimestamp(reward.updatedAt);
    const descriptor = `${reward.project.title} — ${reward.projectStage.name} — ${reward.amount} ${reward.currency}`;

    if (reward.status === "PAID" && paidAt) {
      items.push({
        id: `reward-paid-${reward.id}-${paidAt}`,
        title: "تم دفع مكافأتك",
        body: descriptor,
        timestamp: paidAt,
        section: "rewards",
      });
      continue;
    }

    if (reward.status === "EARNED" && earnedAt) {
      items.push({
        id: `reward-earned-${reward.id}-${earnedAt}`,
        title: "أصبحت مكافأتك مستحقة",
        body: descriptor,
        timestamp: earnedAt,
        section: "rewards",
      });
    }
  }

  for (const referral of payload.referrals || []) {
    const timestamp = validTimestamp(referral.updatedAt);
    if (!timestamp) continue;
    const person = referral.name || referral.email || "الإحالة";

    if (referral.status === "إحالة ناجحة") {
      items.push({
        id: `referral-success-${referral.id}-${timestamp}`,
        title: "أصبحت إحالتك ناجحة ماليًا",
        body: person,
        timestamp,
        section: "referrals",
      });
    } else if (referral.status === "تم الاتفاق — بانتظار أول دفعة") {
      items.push({
        id: `referral-agreed-${referral.id}-${timestamp}`,
        title: "تم الاتفاق مع إحالتك",
        body: `${person} — بانتظار أول دفعة`,
        timestamp,
        section: "referrals",
      });
    } else if (referral.status === "CONVERTED") {
      items.push({
        id: `referral-converted-${referral.id}-${timestamp}`,
        title: "تحولت إحالتك إلى عميل",
        body: person,
        timestamp,
        section: "referrals",
      });
    }
  }

  return items
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 12);
}

function storedSeenIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_IDS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function displayDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "";
  }
}

function reorderHeaderButtons(host: HTMLElement) {
  host.classList.add("flex-wrap", "justify-end");

  const themeButton = host.querySelector<HTMLButtonElement>('button[aria-label="تبديل المظهر"]');
  if (themeButton) themeButton.style.order = "3";

  const logoutButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
    const text = button.textContent || "";
    return text.includes("تسجيل الخروج") || text.includes("العودة للإدارة") || text.includes("جارٍ الخروج");
  });
  if (logoutButton) logoutButton.style.order = "4";
}

export function AmbassadorHeaderTools() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [payload, setPayload] = useState<DashboardPayload>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    queueMicrotask(() => setSeenIds(storedSeenIds()));

    const attach = () => {
      const header = document.querySelector("main header");
      if (!header) return;
      const groups = Array.from(header.querySelectorAll<HTMLElement>("div.flex.items-center.gap-2"));
      const candidate = groups[groups.length - 1] || null;
      if (!candidate) return;
      reorderHeaderButtons(candidate);
      setTarget(candidate);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const node = event.target as Node | null;
      if (node && notificationRef.current && !notificationRef.current.contains(node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside, { passive: true });
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const previewId = new URLSearchParams(window.location.search).get("adminPreview");
      const endpoint = previewId
        ? `/api/ambassador/dashboard?adminPreview=${encodeURIComponent(previewId)}`
        : "/api/ambassador/dashboard";
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as DashboardPayload | null;
      if (response.ok) setPayload(data || {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadNotifications());
  }, []);

  const notifications = useMemo(() => buildNotifications(payload), [payload]);
  const unread = notifications.filter((item) => !seenIds.includes(item.id)).length;

  function rememberSeen(ids: string[]) {
    const next = Array.from(new Set([...seenIds, ...ids])).slice(-100);
    setSeenIds(next);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(next));
  }

  function openSection(section: AmbassadorSection) {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("aside nav button"));
    const button = buttons[SECTION_INDEX[section]];
    if (button) button.click();
  }

  function actOnNotification(item: AmbassadorNotification) {
    rememberSeen([item.id]);
    setOpen(false);
    openSection(item.section);
  }

  function markAllSeen() {
    rememberSeen(notifications.map((item) => item.id));
  }

  function toggleNotifications() {
    setOpen((current) => {
      const next = !current;
      if (next) void loadNotifications();
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
      <div ref={notificationRef} className="relative" style={{ order: 1 }}>
        <button
          type="button"
          aria-label="تنبيهات السفير"
          aria-expanded={open}
          onClick={toggleNotifications}
          className="relative h-11 w-11 rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8] dark:border-slate-700 dark:bg-slate-900"
        >
          <Bell size={20} className="mx-auto" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+10px)] z-[80] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[#D8D2C4] bg-white text-[#111827] shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#E6E0D4] px-4 py-3 dark:border-slate-800">
              <div>
                <p className="font-black">تنبيهات السفير</p>
                <p className="mt-0.5 text-xs text-slate-500">آخر مستجدات الإحالات والمكافآت</p>
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button type="button" onClick={markAllSeen} className="rounded-lg p-2 text-[#9A7D43] hover:bg-[#F7F3EB] dark:hover:bg-slate-800" aria-label="تعليم كل التنبيهات كمقروءة" title="تعليم الكل كمقروء">
                    <CheckCheck size={17} />
                  </button>
                )}
                <button type="button" onClick={() => void loadNotifications()} disabled={loading} className="rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB] disabled:opacity-50 dark:hover:bg-slate-800" aria-label="تحديث التنبيهات">
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {loading && !notifications.length ? (
                <p className="p-5 text-center text-sm text-slate-500">جارٍ تحميل التنبيهات...</p>
              ) : notifications.length ? notifications.map((item) => {
                const isUnread = !seenIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => actOnNotification(item)}
                    className={`group w-full rounded-lg px-3 py-3 text-right transition hover:bg-[#F7F3EB] dark:hover:bg-slate-800/70 ${isUnread ? "bg-[#FFFDF8]" : "opacity-75"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${isUnread ? "bg-[#B89A5A]" : "bg-transparent"}`} />
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#B89A5A]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-black">{item.title}</p>
                          <ArrowLeft size={15} className="mt-1 shrink-0 text-[#9A7D43] transition group-hover:-translate-x-0.5" />
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{displayDate(item.timestamp)}</p>
                      </div>
                    </div>
                  </button>
                );
              }) : (
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
        style={{ order: 2 }}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-black shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
      >
        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        <span className="hidden md:inline">تحديث</span>
      </button>
    </>,
    target,
  );
}
