"use client";

import { TrailingPeriodCleaner } from "@/components/site/trailing-period-cleaner";

export function ThemeStyles() {
  return (
    <>
      <TrailingPeriodCleaner />
      <style jsx global>{`
        .dark {
          --ink: #f7f3eb;
          --floral: #111827;
          --bone: #374151;
          --background: #0b1120;
          --foreground: #f7f3eb;
          --card: #111827;
          --card-foreground: #f7f3eb;
          --popover: #111827;
          --popover-foreground: #f7f3eb;
          --primary: #f7f3eb;
          --primary-foreground: #111827;
          --secondary: #263244;
          --secondary-foreground: #f7f3eb;
          --muted: #182235;
          --muted-foreground: #c8c4ba;
          --accent: #c4a665;
          --accent-foreground: #111827;
          --border: #374151;
          --input: #374151;
          --ring: #c4a665;
          --sidebar: #0b1120;
          --sidebar-foreground: #f7f3eb;
          --sidebar-primary: #f7f3eb;
          --sidebar-primary-foreground: #111827;
          --sidebar-accent: #182235;
          --sidebar-accent-foreground: #f7f3eb;
          --sidebar-border: #374151;
          --sidebar-ring: #c4a665;
          color-scheme: dark;
        }

        .dark .bg-white {
          background-color: #111827 !important;
        }

        .dark .section-texture {
          background-image: radial-gradient(circle at 1px 1px, rgba(247, 243, 235, 0.035) 1px, transparent 0);
        }

        .dark section.bg-ink,
        .dark footer.bg-ink {
          background-color: #111827 !important;
          color: #f7f3eb !important;
        }

        .dark section.bg-ink .text-white,
        .dark footer.bg-ink .text-white,
        .dark section.bg-ink .text-floral,
        .dark footer.bg-ink .text-floral {
          color: #f7f3eb !important;
        }

        .dark section.bg-ink .text-white\/80,
        .dark section.bg-ink .text-white\/70,
        .dark footer.bg-ink .text-bone\/85,
        .dark footer.bg-ink .text-bone\/80,
        .dark footer.bg-ink .text-bone\/70,
        .dark footer.bg-ink .text-bone\/60,
        .dark footer.bg-ink .text-bone\/50 {
          color: rgba(247, 243, 235, 0.76) !important;
        }

        :is(
          a[href*="wa.me"],
          button[type="submit"],
          button.bg-camel,
          button.bg-ink,
          a.bg-camel,
          a.bg-ink,
          .cta-bounce
        ) {
          transform: translateY(0) scale(1);
          transition:
            transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
            box-shadow 180ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
          will-change: transform;
        }

        :is(
          a[href*="wa.me"],
          button[type="submit"],
          button.bg-camel,
          button.bg-ink,
          a.bg-camel,
          a.bg-ink,
          .cta-bounce
        ):hover {
          transform: translateY(-4px) scale(1.025);
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.18);
        }

        :is(
          a[href*="wa.me"],
          button[type="submit"],
          button.bg-camel,
          button.bg-ink,
          a.bg-camel,
          a.bg-ink,
          .cta-bounce
        ):active {
          transform: translateY(-1px) scale(0.99);
        }

        @media (prefers-reduced-motion: reduce) {
          :is(
            a[href*="wa.me"],
            button[type="submit"],
            button.bg-camel,
            button.bg-ink,
            a.bg-camel,
            a.bg-ink,
            .cta-bounce
          ) {
            transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
          }

          :is(
            a[href*="wa.me"],
            button[type="submit"],
            button.bg-camel,
            button.bg-ink,
            a.bg-camel,
            a.bg-ink,
            .cta-bounce
          ):hover,
          :is(
            a[href*="wa.me"],
            button[type="submit"],
            button.bg-camel,
            button.bg-ink,
            a.bg-camel,
            a.bg-ink,
            .cta-bounce
          ):active {
            transform: none;
          }
        }
      `}</style>
    </>
  );
}
