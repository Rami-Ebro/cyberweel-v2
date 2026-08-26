"use client";

import { useEffect } from "react";

const LEGAL_SECTION_IDS = new Set(["privacy", "terms", "refunds", "cookies", "disclaimer"]);

function cleanCurrentUrl() {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(window.history.state, "", cleanUrl);
}

function scrollToLegalSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LegalFragmentNavigation() {
  useEffect(() => {
    const initialSection = decodeURIComponent(window.location.hash.replace(/^#/, ""));

    if (LEGAL_SECTION_IDS.has(initialSection)) {
      cleanCurrentUrl();
      window.requestAnimationFrame(() => scrollToLegalSection(initialSection));
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const sectionId = decodeURIComponent(href.replace(/^#/, ""));
      if (!LEGAL_SECTION_IDS.has(sectionId)) return;

      event.preventDefault();
      scrollToLegalSection(sectionId);

      if (window.location.hash) cleanCurrentUrl();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
