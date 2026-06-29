"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/site/i18n";

type LogoProps = {
  className?: string;
  /** Kept for API compatibility; the transparent logo blends on any background. */
  onDark?: boolean;
  size?: number;
};

/**
 * CyberWeel final logo (transparent background).
 * The arch represents the system, the keystone the critical catalyst,
 * and the vertical white channel inside it represents activation and
 * knowledge flow. Do not redesign — used as-is, fully transparent.
 */
export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <Image
      src="/logo-transparent.png"
      alt="CyberWeel"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}

/** Lockup: logo + wordmark, used in header & footer. */
export function LogoLockup({
  onDark = false,
  size = 40,
  className,
}: LogoProps) {
  const { t, lang } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-3.5", className)}>
      <Logo size={size} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-3xl font-bold tracking-tight",
            onDark ? "text-floral" : "text-ink",
            lang === "ar" && "tracking-normal"
          )}
        >
          CyberWeel
        </span>
        <span
          className={cn(
            "mt-2 text-base font-bold uppercase",
            onDark ? "text-bone/80" : "text-muted-foreground",
            lang === "ar"
              ? "tracking-[0.14em]"
              : "tracking-[0.32em]"
          )}
        >
          {t.progressPartner}
        </span>
      </span>
    </span>
  );
}

"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/site/i18n";

type LogoProps = {
  className?: string;
  /** Kept for API compatibility; the transparent logo blends on any background. */
  onDark?: boolean;
  size?: number;
};

/**
 * CyberWeel final logo (transparent background).
 * The arch represents the system, the keystone the critical catalyst,
 * and the vertical white channel inside it represents activation and
 * knowledge flow. Do not redesign — used as-is, fully transparent.
 */
export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <Image
      src="/logo-transparent.png"
      alt="CyberWeel"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}

/** Lockup: logo + wordmark, used in header & footer. */
export function LogoLockup({
  onDark = false,
  size = 40,
  className,
}: LogoProps) {
  const { t, lang } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-3.5", className)}>
      <Logo size={size} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-3xl font-bold tracking-tight",
            onDark ? "text-floral" : "text-ink",
            lang === "ar" && "tracking-normal"
          )}
        >
          CyberWeel
        </span>
        <span
          className={cn(
            "mt-2 text-base font-bold uppercase",
            onDark ? "text-bone/80" : "text-muted-foreground",
            lang === "ar"
              ? "tracking-[0.14em]"
              : "tracking-[0.32em]"
          )}
        >
          {t.progressPartner}
        </span>
      </span>
    </span>
  );
}
