"use client";

import { useEffect } from "react";

type Mode = "partner" | "ambassador" | "client";

function normalizedCurrencyText(value: string) {
  return value
    .replace(/\$US\s*([0-9][0-9.,]*)/g, "$1 USD")
    .replace(/US\$\s*([0-9][0-9.,]*)/g, "$1 USD")
    .replace(/([0-9][0-9.,]*)\s*US\$/g, "$1 USD");
}

function normalizeCurrencies(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const current = node.nodeValue || "";
    const next = normalizedCurrencyText(current);
    if (next !== current) node.nodeValue = next;
    node = walker.nextNode();
  }
}

function reserveLanguageSpace() {
  const languageButton = Array.from(document.querySelectorAll<HTMLElement>("button"))
    .find((element) => /^(EN|AR)(\s|$)/.test((element.textContent || "").trim()));
  if (!languageButton) return;

  const languageRect = languageButton.getBoundingClientRect();
  if (languageRect.width <= 0 || languageRect.height <= 0) return;

  for (const element of Array.from(document.querySelectorAll<HTMLElement>("button,a"))) {
    if (element === languageButton || element.contains(languageButton) || languageButton.contains(element)) continue;
    const style = window.getComputedStyle(element);
    if (style.position !== "fixed") continue;
    const rect = element.getBoundingClientRect();
    const nearBottomLeft = rect.left < 220 && rect.bottom > window.innerHeight - 150;
    const overlapsLanguage = !(
      rect.right < languageRect.left ||
      rect.left > languageRect.right ||
      rect.bottom < languageRect.top ||
      rect.top > languageRect.bottom
    );
    if (!nearBottomLeft || !overlapsLanguage) continue;

    const desiredLeft = Math.ceil(languageRect.right + 16);
    element.style.left = `${desiredLeft}px`;
    element.style.right = "auto";
  }
}

function fixPartnerEmptyDue(root: HTMLElement) {
  const labels = Array.from(root.querySelectorAll<HTMLElement>("p,span"));
  const label = labels.find((element) => element.textContent?.trim() === "المستحق للدفع الآن");
  if (!label) return;

  const card = label.closest<HTMLElement>("div.rounded-3xl") || label.parentElement?.parentElement;
  if (!card) return;
  const value = Array.from(card.querySelectorAll<HTMLElement>("strong"))
    .find((element) => ["—", "-", ""].includes((element.textContent || "").trim()));
  if (value) value.textContent = "0.00 USD";
}

function fixPartnerSupportLink(root: HTMLElement) {
  for (const link of Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href="/contact"]'))) {
    link.href = "/wa?context=partner-support";
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.title = "التواصل مع فريق CyberWeel عبر واتساب";
  }
}

function isPartnerProjectsHeading(value: string) {
  const text = value.trim().toLowerCase();
  return text === "المشاريع المحالة إليك" || (text.includes("project") && text.includes("assign"));
}

function polishPartnerProjects(root: HTMLElement) {
  const heading = Array.from(root.querySelectorAll<HTMLHeadingElement>("h2"))
    .find((element) => isPartnerProjectsHeading(element.textContent || ""));
  const section = heading?.closest<HTMLElement>("section");
  if (!section) return;

  section.dataset.cyberweelPartnerProjects = "true";
  const intro = heading?.parentElement;
  if (intro) intro.dataset.cyberweelPartnerProjectsIntro = "true";

  for (const h3 of Array.from(section.querySelectorAll<HTMLHeadingElement>("h3"))) {
    const group = h3.parentElement;
    if (group && group !== section) group.dataset.cyberweelPartnerProjectGroup = "true";
  }

  for (const article of Array.from(section.querySelectorAll<HTMLElement>("article"))) {
    article.dataset.cyberweelPartnerProjectCard = "true";
    const top = article.firstElementChild as HTMLElement | null;
    if (top) top.dataset.cyberweelPartnerProjectCardHead = "true";
    for (const block of Array.from(article.querySelectorAll<HTMLElement>("section"))) {
      block.dataset.cyberweelPartnerProjectBlock = "true";
    }
  }
}

function fixClientFinancialPlan(root: HTMLElement) {
  for (const label of Array.from(root.querySelectorAll<HTMLElement>("p"))) {
    const text = (label.textContent || "").trim();
    if (!text.startsWith("الخطة المالية —")) continue;
    const currency = text.split("—").pop()?.trim().toUpperCase() || "USD";
    const card = label.parentElement;
    if (!card) continue;
    const value = Array.from(card.querySelectorAll<HTMLElement>("p"))
      .find((element) => element !== label && element.className.includes("whitespace-pre-wrap"));
    if (!value) continue;
    const raw = value.textContent || "";
    const numbers = raw
      .split(/\s+/)
      .map((item) => Number(item.replace(/,/g, "")))
      .filter((item) => Number.isFinite(item) && item > 0);
    if (numbers.length < 2) continue;
    const total = numbers.reduce((sum, item) => sum + item, 0);
    value.textContent = `${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    label.textContent = "إجمالي قيمة المشروع";
  }
}

export function DashboardVisualPolish({ mode }: { mode: Mode }) {
  useEffect(() => {
    const sync = () => {
      const root = document.body;
      normalizeCurrencies(root);
      reserveLanguageSpace();
      if (mode === "partner") {
        fixPartnerEmptyDue(root);
        fixPartnerSupportLink(root);
        polishPartnerProjects(root);
      }
      if (mode === "client") fixClientFinancialPlan(root);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [mode]);

  if (mode !== "partner") return null;

  return <style jsx global>{`
    [data-cyberweel-partner-projects="true"] {
      gap: 22px !important;
    }

    [data-cyberweel-partner-projects-intro="true"] {
      position: relative;
      overflow: hidden;
      border: 1px solid #283244;
      border-radius: 18px;
      background: linear-gradient(135deg, #111827 0%, #172033 100%);
      padding: 24px 26px 24px 250px;
      box-shadow: 0 16px 38px rgba(17, 24, 39, 0.12);
    }

    [data-cyberweel-partner-projects-intro="true"]::after {
      content: "";
      position: absolute;
      inset-inline-end: -70px;
      top: -90px;
      width: 210px;
      height: 210px;
      border: 1px solid rgba(184, 154, 90, 0.24);
      border-radius: 999px;
      pointer-events: none;
    }

    [data-cyberweel-partner-projects-intro="true"] > p:first-child {
      color: #D6BC82 !important;
      letter-spacing: 0.04em !important;
    }

    [data-cyberweel-partner-projects-intro="true"] > h2 {
      color: #FFFFFF !important;
      font-size: clamp(1.55rem, 2.5vw, 2rem) !important;
      line-height: 1.25 !important;
    }

    [data-cyberweel-partner-projects-intro="true"] > p:last-of-type {
      max-width: 720px !important;
      color: rgba(255, 255, 255, 0.66) !important;
      line-height: 1.9 !important;
    }

    [data-cyberweel-partner-project-group="true"] {
      border: 1px solid #D8D2C4;
      border-radius: 18px;
      background: #FCFAF6;
      padding: 18px;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.04);
    }

    [data-cyberweel-partner-project-group="true"] > h3 {
      margin-bottom: 14px !important;
      color: #111827 !important;
      font-size: 1rem !important;
      font-weight: 900 !important;
    }

    [data-cyberweel-partner-project-card="true"] {
      border-color: #D8D2C4 !important;
      border-radius: 16px !important;
      background: #FFFFFF !important;
      box-shadow: 0 10px 28px rgba(17, 24, 39, 0.055) !important;
    }

    [data-cyberweel-partner-project-card-head="true"] {
      border-color: #E6E0D4 !important;
      background: #FFFDF8 !important;
    }

    [data-cyberweel-partner-project-card="true"] h3,
    [data-cyberweel-partner-project-card="true"] h4 {
      color: #111827 !important;
    }

    [data-cyberweel-partner-project-block="true"] {
      border: 1px solid #E6E0D4 !important;
      border-radius: 14px !important;
      background: #F7F3EB !important;
      box-shadow: none !important;
    }

    [data-cyberweel-partner-project-card="true"] .text-\[\#bd9850\],
    [data-cyberweel-partner-project-card="true"] .text-\[\#9f7d3d\] {
      color: #9A7D43 !important;
    }

    [data-cyberweel-partner-project-card="true"] .bg-\[\#bd9850\] {
      background-color: #B89A5A !important;
    }

    .dark [data-cyberweel-partner-project-group="true"] {
      border-color: #334155;
      background: #111827;
    }

    .dark [data-cyberweel-partner-project-group="true"] > h3,
    .dark [data-cyberweel-partner-project-card="true"] h3,
    .dark [data-cyberweel-partner-project-card="true"] h4 {
      color: #F8FAFC !important;
    }

    .dark [data-cyberweel-partner-project-card="true"] {
      border-color: #334155 !important;
      background: #0F172A !important;
    }

    .dark [data-cyberweel-partner-project-card-head="true"] {
      border-color: #334155 !important;
      background: #111827 !important;
    }

    .dark [data-cyberweel-partner-project-block="true"] {
      border-color: #334155 !important;
      background: #111827 !important;
    }

    @media (max-width: 900px) {
      [data-cyberweel-partner-projects-intro="true"] {
        padding: 22px !important;
      }

      [data-cyberweel-delivery-launcher="true"] {
        position: static !important;
        margin-top: 18px;
        transform: none !important;
      }

      [data-cyberweel-delivery-launcher="true"] > button {
        width: 100%;
        min-width: 0 !important;
      }
    }
  `}</style>;
}
