"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Per-section reading progress bar.
 * Renders a thin camel bar pinned to the top of the section that fills
 * as the user scrolls through it. Calm, premium, non-intrusive.
 * Mounts a sticky bar at the section's top edge.
 */
export function SectionReadingBar({
  sectionId,
  className,
}: {
  sectionId: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when section top is at viewport bottom, 1 when section bottom is at viewport top
      const total = rect.height + vh;
      const passed = vh - rect.top;
      const p = Math.max(0, Math.min(1, passed / total));
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sectionId]);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-transparent",
        className
      )}
      aria-hidden
    >
      <div
        className="h-full bg-camel/60 transition-[width] duration-150 ease-out"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}
