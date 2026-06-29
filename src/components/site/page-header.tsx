"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/site/i18n";
import type { ReactNode } from "react";

/**
 * Inner-view page header — premium, spacious.
 * Single-language: eyebrow + title + intro in the active language.
 * Balanced two-column layout on desktop: content + quiet motif right.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  onDark = false,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  onDark?: boolean;
  actions?: ReactNode;
}) {
  const { t, dir } = useI18n();

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-border",
        onDark ? "bg-ink" : "bg-background"
      )}
    >
      {/* Quiet architectural motif honoring the logo (arch line) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(110% 70% at 85% -10%, rgba(184,154,90,0.07), transparent 55%)",
        }}
      />
      <div className="cw-container relative grid gap-10 py-20 sm:py-24 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:py-28">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className={cn("eyebrow-camel leading-none", onDark && "text-camel")}>
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "mt-6 font-display text-4xl font-light leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl",
              onDark ? "text-floral" : "text-ink"
            )}
          >
            {title}
          </h1>
          {intro && (
            <p
              className={cn(
                "mt-7 max-w-2xl text-lg leading-relaxed sm:text-xl",
                onDark ? "text-bone/80" : "text-muted-foreground"
              )}
            >
              {intro}
            </p>
          )}
          {actions && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>

        {/* Right-side quiet motif: arch + keystone + tagline, desktop only */}
        <div className="relative hidden lg:flex lg:justify-end">
          <div className="flex flex-col items-end gap-3">
            <svg
              width="150"
              height="150"
              viewBox="0 0 120 120"
              fill="none"
              className={onDark ? "text-bone/30" : "text-bone"}
              aria-hidden
            >
              <path
                d="M14 112 V60 a46 46 0 0 1 92 0 V112"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M24 112 V60 a36 36 0 0 1 72 0 V112"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                opacity="0.5"
              />
              <path d="M52 16 L68 16 L64 28 L56 28 Z" fill="var(--camel)" />
              <line
                x1="60"
                y1="18"
                x2="60"
                y2="28"
                stroke={onDark ? "var(--floral)" : "#FFFFFF"}
                strokeWidth="1.5"
              />
            </svg>
            <div
              className={cn(
                "max-w-[220px] border-r-2 pr-4 text-right",
                onDark ? "border-camel/50 text-bone/70" : "border-camel/50 text-muted-foreground"
              )}
            >
              <p className="font-display text-base leading-snug">
                {t.brandTagline}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm font-medium tracking-[0.2em]",
                  onDark ? "text-bone/40" : "text-muted-foreground/70"
                )}
              >
                {t.footer.methodology}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
