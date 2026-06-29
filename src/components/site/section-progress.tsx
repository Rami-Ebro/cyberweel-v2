"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  label: string;
};

/**
 * A quiet, fixed right-rail section progress indicator for long pages.
 * Shows the current section and lets users jump by clicking.
 * Desktop-only (hidden below lg). Calm, premium, non-intrusive.
 */
export function SectionProgress({
  sections,
}: {
  sections: Section[];
}) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docH > 0 ? Math.min(scrollY / docH, 1) : 0);

      // find the section whose top is nearest above the viewport center
      const mid = scrollY + window.innerHeight * 0.4;
      let current = 0;
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= mid) current = i;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const handleClick = (i: number) => {
    const el = document.getElementById(sections[i].id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    }
  };

  return (
    <div
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
      aria-label="Section progress"
      role="navigation"
    >
      <div className="flex flex-col items-end gap-3">
        {/* vertical progress track */}
        <div className="relative flex flex-col items-end gap-2.5">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleClick(i)}
              className="group flex items-center gap-3"
              aria-label={`Jump to ${s.label}`}
              aria-current={i === active ? "true" : undefined}
            >
              <span
                className={cn(
                  "text-sm font-medium uppercase tracking-[0.2em] transition-colors",
                  i === active
                    ? "text-ink"
                    : "text-transparent group-hover:text-muted-foreground"
                )}
              >
                {s.label}
              </span>
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  i === active
                    ? "w-6 bg-accent"
                    : "w-1.5 bg-border group-hover:bg-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
        {/* overall progress dot */}
        <div className="mt-2 h-px w-8 bg-border" aria-hidden />
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {String(Math.round(progress * 100)).padStart(2, "0")}%
        </span>
      </div>
    </div>
  );
}
