"use client";

import { useEffect } from "react";
import type { ViewId } from "@/lib/site-data";

const G_MAP: Record<string, ViewId> = {
  h: "home",
  w: "how-we-help",
  c: "share-challenge",
  p: "partner",
  a: "about",
  t: "contact",
};

/**
 * Centralized keyboard navigation for the site.
 *  - G then H/W/C/P/A/T  → jump to a page
 *  Keeps a short timeout so a stray G doesn't linger.
 */
export function useKeyboardNav(navigate: (v: ViewId) => void) {
  useEffect(() => {
    let pendingG = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const reset = () => {
      pendingG = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      const key = e.key.toLowerCase();

      if (key === "g" && !inField) {
        pendingG = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(reset, 900);
        return;
      }

      if (pendingG && G_MAP[key]) {
        e.preventDefault();
        navigate(G_MAP[key]);
        reset();
      } else if (pendingG) {
        reset();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [navigate]);
}
