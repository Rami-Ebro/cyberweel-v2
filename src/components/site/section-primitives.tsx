"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/components/site/i18n";
import type { ReactNode } from "react";

/** Consistent section wrapper with calm vertical rhythm. */
export function Section({
  children,
  className,
  tone = "floral",
  id,
  before,
}: {
  children: ReactNode;
  className?: string;
  tone?: "floral" | "ink" | "muted";
  id?: string;
  before?: ReactNode;
}) {
  const toneClass =
    tone === "ink"
      ? "bg-ink text-floral"
      : tone === "muted"
      ? "bg-muted text-ink"
      : "bg-background text-ink";
  return (
    <section id={id} className={cn("py-20 sm:py-24 lg:py-28", toneClass, className)}>
      {before}
      <div className="cw-container">{children}</div>
    </section>
  );
}

/** Eyebrow + title + optional intro block. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  onDark = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <div className={cn("flex items-center gap-2.5", align === "center" && "justify-center")}>
          <span className="h-1.5 w-1.5 rotate-45 bg-camel" aria-hidden />
          <p className={cn("eyebrow-camel", onDark && "text-camel")}>{eyebrow}</p>
        </div>
      )}
      <h2
        className={cn(
          "mt-5 font-display text-[2rem] font-light leading-[1.12] tracking-tight sm:text-4xl lg:text-[3.25rem]",
          onDark ? "text-floral" : "text-ink"
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-6 text-base leading-relaxed sm:text-lg",
            onDark ? "text-bone/75" : "text-muted-foreground"
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/** Primary Camel-toned button used across views. */
export function PrimaryCta({
  children,
  onClick,
  href,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const { dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const classes = cn(
    "focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-camel px-7 py-3.5 text-base font-medium text-ink transition-all hover:bg-camel/90 hover:shadow-sm",
    className
  );
  const content = (
    <>
      {children}
      <Arrow className="h-4 w-4" />
    </>
  );
  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

/** Quiet outline button for secondary actions. */
export function GhostCta({
  children,
  onClick,
  onDark = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-md border px-7 py-3.5 text-base font-medium transition-colors",
        onDark
          ? "border-floral/25 text-floral hover:bg-floral/10"
          : "border-border text-ink hover:bg-muted",
        className
      )}
    >
      {children}
    </button>
  );
}
