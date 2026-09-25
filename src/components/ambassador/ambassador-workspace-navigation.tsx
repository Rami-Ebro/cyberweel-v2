"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

function applyWorkspaceLabels(homeHref: string) {
  const nav = document.querySelector<HTMLElement>("aside nav");
  const buttons = dashboardButtons();
  buttons.forEach((button, index) => {
    if (LABELS[index]) {
      const textNodes = Array.from(button.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
      if (textNodes.length) textNodes[textNodes.length - 1].textContent = LABELS[index];
    }
  });
  if (buttons[0]) buttons[0].classList.add("hidden");

  if (nav && !nav.querySelector("#ambassador-v2-home-link")) {
    const home = document.createElement("a");
    home.id = "ambassador-v2-home-link";
    home.href = homeHref;
    home.className = "flex w-full items-center gap-3 rounded-2xl bg-[#bd9850] px-4 py-3.5 text-right font-black text-slate-950 transition";
    home.innerHTML = '<span aria-hidden="true" class="text-lg">⌂</span><span>الرئيسية</span>';
    nav.prepend(home);
  }

  document.querySelectorAll<HTMLElement>("main, aside").forEach((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      let value = node.nodeValue || "";
      value = value.replaceAll("Gemini", "CyberWeel");
      value = value.replaceAll("أدوات السفير", "جلب عميل جديد");
      value = value.replaceAll("AMBASSADOR WORKSPACE V2", "مساحة سفير CyberWeel");
      value = value.replaceAll("اللوحة الحالية", "كل الأدوات");
      node.nodeValue = value;
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

/** Task-based, thumb-friendly navigation for the ambassador workspace. */
export function AmbassadorWorkspaceNavigation({ actionCenter = false }: { actionCenter?: boolean }) {
  const searchParams = useSearchParams();
  const previewId = searchParams.get("adminPreview");
  const suffix = previewId ? `?adminPreview=${encodeURIComponent(previewId)}` : "";
  const homeHref = `/ambassador/action-center${suffix}`;
  const dashboardHref = (hash: string) => `/ambassador/dashboard${suffix}${hash}`;

  useEffect(() => {
    const sync = () => {
      applyWorkspaceLabels(homeHref);
      openHashSection();
    };
    sync();
    const observer = new MutationObserver(() => applyWorkspaceLabels(homeHref));
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", openHashSection);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", openHashSection);
    };
  }, [homeHref]);

  return (
    <nav aria-label="التنقل السريع للسفير" className="fixed inset-x-2 bottom-2 z-[65] grid grid-cols-4 gap-1 rounded-2xl border border-[#D8D2C4] bg-white/95 p-1.5 shadow-2xl backdrop-blur lg:hidden">
      <Link href={homeHref} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827] ${actionCenter ? "bg-[#F3EAD7]" : ""}`}><Home size={20} /><span>الرئيسية</span></Link>
      <a href={dashboardHref("#referrals")} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><UsersRound size={20} /><span>إحالاتي</span></a>
      <a href={dashboardHref("#new-client")} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><UserPlus size={20} /><span>عميل جديد</span></a>
      <a href={dashboardHref("#rewards")} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black text-[#111827]"><BadgeDollarSign size={20} /><span>أرباحي</span></a>
    </nav>
  );
}
