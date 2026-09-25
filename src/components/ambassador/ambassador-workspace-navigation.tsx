"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BadgeDollarSign, Home, UserPlus, UsersRound } from "lucide-react";

const SECTION_BY_HASH: Record<string, number> = {
  "#new-client": 1,
  "#referrals": 2,
  "#rewards": 3,
  "#account": 4,
};

const LABELS = ["الرئيسية القديمة", "جلب عميل جديد", "عملائي وإحالاتي", "أرباحي", "حسابي"];

function dashboardButtons() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("aside nav button"));
}

function applyWorkspaceLabels() {
  const buttons = dashboardButtons();
  buttons.forEach((button, index) => {
    if (LABELS[index]) {
      const textNodes = Array.from(button.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
      if (textNodes.length) textNodes[textNodes.length - 1].textContent = LABELS[index];
    }
  });

  // The action center is the real home in V2, so the old overview is intentionally hidden.
  if (buttons[0]) buttons[0].classList.add("hidden");

  document.querySelectorAll<HTMLElement>("main, aside").forEach((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      if (node.nodeValue?.includes("Gemini")) node.nodeValue = node.nodeValue.replaceAll("Gemini", "CyberWeel");
      if (node.nodeValue?.includes("أدوات السفير")) node.nodeValue = node.nodeValue.replaceAll("أدوات السفير", "جلب عميل جديد");
    });
  });
}

function openHashSection() {
  const index = SECTION_BY_HASH[window.location.hash];
  if (index === undefined) return;
  const button = dashboardButtons()[index];
  if (button) {
    button.click();
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }
}

/** Transitional V2 navigation: task language, thumb-friendly mobile bar, and Action Center as home. */
export function AmbassadorWorkspaceNavigation() {
  useEffect(() => {
    const sync = () => {
      applyWorkspaceLabels();
      openHashSection();
    };
    sync();
    const observer = new MutationObserver(applyWorkspaceLabels);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", openHashSection);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", openHashSection);
    };
  }, []);

  return (
    <>
      <Link
        href="/ambassador/action-center"
        className="fixed right-5 top-[132px] z-[55] hidden w-[270px] items-center gap-3 rounded-2xl bg-[#B89A5A] px-4 py-3.5 font-black text-[#111827] shadow-sm lg:flex"
      >
        <Home size={20} />
        الرئيسية
      </Link>

      <nav aria-label="التنقل السريع للسفير" className="fixed inset-x-2 bottom-2 z-[65] grid grid-cols-4 gap-1 rounded-2xl border border-[#D8D2C4] bg-white/95 p-1.5 shadow-2xl backdrop-blur lg:hidden">
        <Link href="/ambassador/action-center" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><Home size={20} /><span>الرئيسية</span></Link>
        <a href="/ambassador/dashboard#referrals" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><UsersRound size={20} /><span>إحالاتي</span></a>
        <a href="/ambassador/dashboard#new-client" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><UserPlus size={20} /><span>عميل جديد</span></a>
        <a href="/ambassador/dashboard#rewards" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><BadgeDollarSign size={20} /><span>أرباحي</span></a>
      </nav>
    </>
  );
}
