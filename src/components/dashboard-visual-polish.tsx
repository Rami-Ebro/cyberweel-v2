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
      if (mode === "partner") fixPartnerEmptyDue(root);
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

  return null;
}
