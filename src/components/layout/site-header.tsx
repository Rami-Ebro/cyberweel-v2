"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
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
import { CommandPalette } from "@/components/site/command-palette";
import { LanguageSwitcher } from "@/components/site/language-switcher";

export function SiteHeader() {
  const { view, navigate } = useNav();
  const { t, dir } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const go = (id: ViewId) => {
    navigate(id);
    setMobileOpen(false);
  };

  const navLabel = (id: ViewId) => {
    if (dir === "rtl" && id === "how-we-help") return "كيف نساعدك";
    if (dir === "rtl" && id === "share-challenge") return "شاركنا مشكلتك";
    return t.nav[id];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="cw-container flex h-28 items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => go("home")}
            className="focus-ring rounded-md p-0"
            aria-label={`${BRAND_NAME} — ${t.nav.home}`}
          >
            <LogoLockup size={78} />
          </button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
            className="focus-ring group relative rounded-md px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
          >
            {t.nav.home}
            <span
              className="absolute inset-x-3.5 -bottom-[1px] h-[2px] bg-accent transition-transform duration-300 scale-x-0 group-hover:scale-x-100"
              aria-hidden
            />
          </Link>
          {NAV_ITEMS.filter((n) => n.id !== "home").map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  "focus-ring group relative rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-ink"
                    : "text-muted-foreground hover:text-ink"
                )}
                aria-current={active ? "page" : undefined}
              >
                {navLabel(item.id)}
                <span
                  className={cn(
                    "absolute inset-x-3.5 -bottom-[1px] h-[2px] bg-accent transition-transform duration-300",
                    dir === "rtl" ? "origin-right" : "origin-left",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Command palette trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="focus-ring hidden h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-ink lg:inline-flex"
            aria-label={t.commandPalette.title}
          >
            <Search className="h-4 w-4" />
            <kbd className="text-sm font-medium tracking-wide">⌘K</kbd>
          </button>

          <LanguageSwitcher />

          <a
            href={BRAND.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring hidden items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-floral transition-colors hover:bg-ink/90 sm:inline-flex"
          >
            {t.hero.primaryCta}
          </a>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md text-ink lg:hidden"
                aria-label={t.nav.home}
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side={dir === "rtl" ? "left" : "right"}
              className="w-full max-w-sm border-border bg-background p-0"
            >
              <SheetHeader className="border-b border-border px-6 py-5 text-start">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-start">
                    <LogoLockup size={40} />
                  </SheetTitle>
                </div>
              </SheetHeader>
              <nav
                className="flex flex-col px-3 py-4"
                aria-label="Mobile"
              >
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className={cn(
                        "focus-ring group flex items-center justify-between rounded-md px-4 py-4 text-start text-base transition-colors",
                        active
                          ? "bg-muted text-ink"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-ink"
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
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-6 py-6">
                <LanguageSwitcher />
                <a
                  href={BRAND.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-floral transition-colors hover:bg-ink/90"
                >
                  {t.hero.primaryCta}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

const BRAND_NAME = "CyberWeel";
