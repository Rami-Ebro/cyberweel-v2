"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

function textOf(element: Element | null) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim();
}

function markClientDashboard() {
  const root = document.querySelector<HTMLElement>('main[dir="rtl"]');
  if (!root) return null;

  const grid = root.firstElementChild as HTMLElement | null;
  const aside = root.querySelector<HTMLElement>("aside");
  const content = grid?.querySelector<HTMLElement>(":scope > section") || null;
  const header = content?.querySelector<HTMLElement>("header") || null;
  if (!grid || !aside || !content || !header) return null;

  root.dataset.cwClientRoot = "true";
  grid.dataset.cwClientGrid = "true";
  aside.dataset.cwClientAside = "true";
  content.dataset.cwClientContent = "true";
  header.dataset.cwClientHeader = "true";

  const controls = Array.from(header.querySelectorAll<HTMLElement>("div"))
    .find((element) => element.classList.contains("flex-wrap") && element.classList.contains("gap-3")) || null;
  if (controls) controls.dataset.cwClientHeaderControls = "true";

  const notificationButton = Array.from(header.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => textOf(button).startsWith("الإشعارات"));
  if (notificationButton) {
    notificationButton.dataset.cwClientNotificationButton = "true";
    notificationButton.setAttribute("aria-label", "تنبيهات العميل");
    const container = notificationButton.parentElement;
    if (container) container.dataset.cwClientNotifications = "true";
  }

  const refreshButton = Array.from(header.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => textOf(button).includes("تحديث البيانات"));
  if (refreshButton) {
    refreshButton.dataset.cwClientRefreshButton = "true";
    refreshButton.setAttribute("aria-label", "تحديث لوحة العميل");
    for (const node of Array.from(refreshButton.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes("تحديث البيانات")) node.nodeValue = "تحديث";
    }
  }

  const languageButton = Array.from(header.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => /^(EN|AR)(\s|$)/.test(textOf(button)));
  if (languageButton) languageButton.dataset.cwClientLanguageButton = "true";

  const sidebarLogout = Array.from(aside.querySelectorAll<HTMLButtonElement>("button"))
    .find((button) => textOf(button) === "تسجيل الخروج");
  if (sidebarLogout) sidebarLogout.dataset.cwClientSidebarLogout = "true";

  const brandButton = aside.querySelector<HTMLElement>("button");
  if (brandButton) brandButton.dataset.cwClientBrand = "true";

  const nav = aside.querySelector<HTMLElement>("nav");
  if (nav) nav.dataset.cwClientNav = "true";

  return { root, aside, header, controls };
}

export function ClientDashboardParityTools() {
  const router = useRouter();
  const [controls, setControls] = useState<HTMLElement | null>(null);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [aside, setAside] = useState<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const sync = () => {
      const marked = markClientDashboard();
      if (!marked) return;
      setControls(marked.controls);
      setRoot(marked.root);
      setAside(marked.aside);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!root) return;
    root.dataset.cwClientMenuOpen = menuOpen ? "true" : "false";
  }, [menuOpen, root]);

  useEffect(() => {
    if (!aside) return;
    const closeAfterNavigation = (event: Event) => {
      if ((event.target as Element | null)?.closest("button,a")) setMenuOpen(false);
    };
    aside.addEventListener("click", closeAfterNavigation);
    return () => aside.removeEventListener("click", closeAfterNavigation);
  }, [aside]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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
    <>
      {controls && createPortal(
        <>
          <button
            type="button"
            aria-label="فتح القائمة"
            onClick={() => setMenuOpen(true)}
            data-cw-client-menu-button="true"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D8D2C4] bg-white shadow-sm transition hover:border-[#B89A5A] hover:bg-[#FFFDF8] lg:hidden"
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            data-cw-client-header-logout="true"
            className="hidden h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 font-black text-white transition hover:bg-rose-700 disabled:opacity-60 sm:inline-flex"
          >
            <LogOut size={18} />
            {loggingOut ? "جارٍ الخروج" : "تسجيل الخروج"}
          </button>
        </>,
        controls,
      )}

      {menuOpen && typeof document !== "undefined" && createPortal(
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMenuOpen(false)}
          data-cw-client-menu-overlay="true"
          className="fixed inset-0 z-[60] bg-slate-950/55 lg:hidden"
        >
          <span className="sr-only">إغلاق القائمة</span>
        </button>,
        document.body,
      )}

      {aside && menuOpen && createPortal(
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMenuOpen(false)}
          data-cw-client-menu-close="true"
          className="fixed left-3 top-3 z-[80] rounded-xl p-2 text-white/75 hover:bg-white/10 lg:hidden"
        >
          <X size={22} />
        </button>,
        aside,
      )}

      <style jsx global>{`
        [data-cw-client-root="true"] {
          background: #f5f1e8 !important;
        }

        [data-cw-client-header="true"] {
          position: sticky !important;
          top: 0;
          z-index: 30;
          margin: -1rem -1rem 0;
          padding: 1rem;
          border-bottom: 1px solid rgba(216, 210, 196, 0.82);
          background: rgba(245, 241, 232, 0.92);
          backdrop-filter: blur(16px);
        }

        [data-cw-client-header-controls="true"] {
          align-items: center;
          gap: 0.5rem !important;
          justify-content: flex-end;
        }

        [data-cw-client-notifications="true"] {
          order: 1;
        }

        [data-cw-client-notification-button="true"] {
          width: 44px !important;
          height: 44px !important;
          padding: 0 !important;
          gap: 0 !important;
          font-size: 0 !important;
          border-color: #d8d2c4 !important;
        }

        [data-cw-client-notification-button="true"] > span {
          font-size: 10px !important;
          min-width: 20px !important;
          min-height: 20px !important;
          padding: 0 4px !important;
          position: absolute;
          inset-inline-end: -6px;
          top: -6px;
        }

        [data-cw-client-refresh-button="true"] {
          order: 2;
          height: 44px !important;
          padding: 0 12px !important;
          border-color: #d8d2c4 !important;
        }

        [data-cw-client-language-button="true"] {
          order: 3;
          min-height: 44px;
        }

        [data-cw-client-header-logout="true"] {
          order: 4;
        }

        [data-cw-client-menu-button="true"] {
          order: 0;
        }

        [data-cw-client-sidebar-logout="true"] {
          display: none !important;
        }

        [data-cw-client-brand="true"] {
          min-height: 76px;
          border-bottom-color: rgba(255, 255, 255, 0.1) !important;
        }

        [data-cw-client-nav="true"] button {
          border-radius: 16px !important;
          padding-block: 14px !important;
          font-weight: 900 !important;
        }

        [data-cw-client-notifications="true"] > div {
          z-index: 90 !important;
          border-radius: 14px !important;
          box-shadow: 0 24px 60px rgba(17, 24, 39, 0.18) !important;
        }

        @media (min-width: 640px) {
          [data-cw-client-header="true"] {
            margin: -1.75rem -1.75rem 0;
            padding: 1rem 1.75rem;
          }
        }

        @media (min-width: 1024px) {
          [data-cw-client-grid="true"] {
            grid-template-columns: 310px minmax(0, 1fr) !important;
          }

          [data-cw-client-aside="true"] {
            width: 310px;
            padding: 24px !important;
            background: #101827 !important;
          }

          [data-cw-client-header="true"] {
            margin: -2.5rem -2.5rem 0;
            padding: 1rem 2.5rem;
          }
        }

        @media (max-width: 1023px) {
          [data-cw-client-grid="true"] {
            display: block !important;
          }

          [data-cw-client-aside="true"] {
            position: fixed !important;
            inset: 0 0 0 auto !important;
            z-index: 70 !important;
            display: flex !important;
            width: min(310px, 88vw) !important;
            height: 100dvh !important;
            flex-direction: column !important;
            overflow-y: auto !important;
            padding: 24px !important;
            background: #101827 !important;
            box-shadow: -20px 0 55px rgba(15, 23, 42, 0.28) !important;
            transform: translateX(105%);
            transition: transform 220ms ease;
          }

          [data-cw-client-root="true"][data-cw-client-menu-open="true"] [data-cw-client-aside="true"] {
            transform: translateX(0);
          }

          [data-cw-client-content="true"] {
            min-width: 0;
          }
        }

        @media (max-width: 639px) {
          [data-cw-client-header="true"] {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          [data-cw-client-header="true"] h1 {
            font-size: 1.35rem !important;
          }

          [data-cw-client-header-controls="true"] {
            width: 100%;
            justify-content: flex-start;
          }

          [data-cw-client-refresh-button="true"] {
            width: 44px !important;
            padding: 0 !important;
            font-size: 0 !important;
          }

          [data-cw-client-refresh-button="true"] svg {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </>
  );
}
