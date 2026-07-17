"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, BRAND, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { ThemeToggle } from "@/components/site/theme-toggle";

const HEADER_ITEMS = NAV_ITEMS.filter((item) => item.id !== "share-challenge");

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Logo size={compact ? 42 : 54} />
      <span className="flex flex-col">
        <span
          aria-label="CyberWeel"
          className={cn(
            "block bg-ink",
            compact ? "h-[31px] w-[116px]" : "h-[40px] w-[148px]"
          )}
          style={{
            WebkitMaskImage: "url('/cyberweel-wordmark.svg')",
            maskImage: "url('/cyberweel-wordmark.svg')",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        {!compact && (
          <span className="mt-1 text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
            شريك تقدّم
          </span>
        )}
      </span>
    </span>
  );
}

export function SiteHeaderRefined() {
  const { view, navigate } = useNav();
  const { t, dir } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (id: ViewId) => {
    navigate(id);
    setMobileOpen(false);
  };

  const navLabel = (id: ViewId) => {
    if (dir === "rtl" && id === "how-we-help") return "كيف نساعدك";
    return t.nav[id];
  };

  const menuLabel = dir === "rtl" ? "فتح القائمة" : "Open menu";
  const ctaLabel = dir === "rtl" ? "ابدأ محادثة الآن" : "Start a conversation";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="cw-container flex h-24 items-center justify-between">
        <button
          type="button"
          onClick={() => go("home")}
          className="focus-ring rounded-md"
          aria-label={`CyberWeel — ${t.nav.home}`}
        >
          <Wordmark />
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {HEADER_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  "focus-ring group relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-ink" : "text-muted-foreground hover:text-ink"
                )}
                aria-current={active ? "page" : undefined}
              >
                {navLabel(item.id)}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-[1px] h-[2px] bg-accent transition-transform duration-300",
                    dir === "rtl" ? "origin-right" : "origin-left",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <a
            href={BRAND.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring hidden items-center rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-floral transition-colors hover:bg-ink/90 sm:inline-flex"
          >
            {ctaLabel}
          </a>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md text-ink lg:hidden"
                aria-label={menuLabel}
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side={dir === "rtl" ? "left" : "right"}
              className="flex w-full max-w-sm flex-col border-border bg-background p-0"
            >
              <SheetHeader className="border-b border-border px-6 py-5 text-start">
                <SheetTitle className="text-start">
                  <Wordmark compact />
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col px-3 py-4" aria-label="Mobile">
                {HEADER_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className={cn(
                        "focus-ring flex items-center justify-between rounded-md px-4 py-4 text-start text-base transition-colors",
                        active ? "bg-muted text-ink" : "text-muted-foreground hover:bg-muted/60 hover:text-ink"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-accent" />
                        <span className="font-medium">{navLabel(item.id)}</span>
                      </span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 border-t border-border px-6 py-6">
                <button
                  type="button"
                  onClick={() => go("share-challenge")}
                  className="focus-ring flex w-full items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-muted"
                >
                  {dir === "rtl" ? "شاركنا مشكلتك" : "Share your challenge"}
                </button>
                <a
                  href={BRAND.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring flex w-full items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-semibold text-floral transition-colors hover:bg-ink/90"
                >
                  {ctaLabel}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
