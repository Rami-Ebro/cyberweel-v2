"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ViewId } from "@/lib/site-data";

const VIEW_PATHS: Record<ViewId, string> = {
  home: "/",
  "how-we-help": "/how-we-help",
  "share-challenge": "/share-challenge",
  partner: "/partner",
  about: "/about",
  contact: "/contact-us",
};

const PATH_VIEWS = Object.entries(VIEW_PATHS).reduce<Record<string, ViewId>>(
  (acc, [view, path]) => {
    acc[path] = view as ViewId;
    return acc;
  },
  {},
);

function parseLegacyHash(): ViewId | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  return Object.prototype.hasOwnProperty.call(VIEW_PATHS, raw) ? (raw as ViewId) : null;
}

function withCurrentQuery(path: string) {
  if (typeof window === "undefined") return path;
  return `${path}${window.location.search}`;
}

/**
 * Public navigation uses real, clean paths so links are shareable and indexable.
 * Legacy hash URLs remain supported and are normalized to their clean path.
 * Existing query parameters are preserved so referral attribution is not lost.
 */
export function useViewRouter(initialView: ViewId = "home") {
  const router = useRouter();
  const pathname = usePathname();
  const view = PATH_VIEWS[pathname] ?? initialView;

  useEffect(() => {
    const legacyView = parseLegacyHash();
    if (!legacyView) return;

    router.replace(withCurrentQuery(VIEW_PATHS[legacyView]), { scroll: false });
  }, [router]);

  const navigate = useCallback(
    (next: ViewId) => {
      const target = withCurrentQuery(VIEW_PATHS[next]);

      if (view === next) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push(target, { scroll: false });
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    },
    [router, view],
  );

  return { view, navigate };
}
