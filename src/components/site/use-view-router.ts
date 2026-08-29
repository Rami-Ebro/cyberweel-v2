"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ViewId } from "@/lib/site-data";
import { PUBLIC_PATH_VIEWS, PUBLIC_VIEW_PATHS, publicViewPath } from "@/lib/public-navigation";

function legacyHashTarget(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  if (raw === "ambassador") {
    const params = new URLSearchParams(window.location.search);
    params.set("path", "ambassador");
    return `/partner?${params.toString()}`;
  }
  return Object.prototype.hasOwnProperty.call(PUBLIC_VIEW_PATHS, raw)
    ? publicViewPath(raw as ViewId, window.location.search)
    : null;
}

function withCurrentQuery(path: string) {
  if (typeof window === "undefined") return path;
  const params = new URLSearchParams(window.location.search);
  params.delete("path");
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Public navigation uses real, clean paths so links are shareable and indexable.
 * Legacy hash URLs remain supported and are normalized to their clean path.
 * Existing query parameters are preserved so referral attribution is not lost.
 */
export function useViewRouter(initialView: ViewId = "home") {
  const router = useRouter();
  const pathname = usePathname();
  const view = PUBLIC_PATH_VIEWS[pathname] ?? initialView;

  useEffect(() => {
    const legacyTarget = legacyHashTarget();
    if (legacyTarget) {
      router.replace(legacyTarget, { scroll: false });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, router]);

  const navigate = useCallback(
    (next: ViewId) => {
      const target = withCurrentQuery(PUBLIC_VIEW_PATHS[next]);

      if (view === next) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push(target, { scroll: false });
    },
    [router, view],
  );

  return { view, navigate };
}
