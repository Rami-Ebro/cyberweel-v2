"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ViewId } from "@/lib/site-data";

const VALID_VIEWS: ViewId[] = [
  "home",
  "how-we-help",
  "share-challenge",
  "partner",
  "about",
  "contact",
];

function parseHash(): ViewId {
  if (typeof window === "undefined") return "home";
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (VALID_VIEWS.includes(raw as ViewId)) return raw as ViewId;
  return "home";
}

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getSnapshot(): ViewId {
  return parseHash();
}

function getServerSnapshot(): ViewId {
  return "home";
}

/**
 * Lightweight hash-based view router.
 * Gives a multi-page feel (distinct shareable URLs, back-button support)
 * while honoring the single user-visible route constraint.
 */
export function useViewRouter() {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const navigate = useCallback((next: ViewId) => {
    if (typeof window === "undefined") return;
    if (parseHash() === next) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = `/${next}`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return { view, navigate };
}
