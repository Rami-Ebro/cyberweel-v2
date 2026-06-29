<<<<<<< HEAD
"use client";

import { useEffect } from "react";
import { Command as CommandPrimitive } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ITEMS, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Quick navigation command palette.
 * Open with Cmd/Ctrl+K. Keyboard-first, premium, calm.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { navigate } = useNav();
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (id: ViewId) => {
    navigate(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border bg-background p-0 shadow-2xl sm:max-w-[520px]">
        <DialogTitle className="sr-only">{t.commandPalette.title}</DialogTitle>
        <CommandPrimitive className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              placeholder={t.commandPalette.placeholder}
              className="h-14 flex-1 bg-transparent text-sm text-ink placeholder:text-muted-foreground/70 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-sm font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <CommandPrimitive.List className="max-h-[320px] overflow-y-auto p-2">
            <CommandPrimitive.Empty>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Logo size={40} />
                <p className="text-sm text-muted-foreground">
                  {t.commandPalette.emptyTitle}
                </p>
              </div>
            </CommandPrimitive.Empty>

            <CommandPrimitive.Group
              heading={t.commandPalette.pagesHeading}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandPrimitive.Item
                    key={item.id}
                    value={t.nav[item.id]}
                    onSelect={() => go(item.id)}
                    className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm text-ink aria-selected:bg-muted data-[selected=true]:bg-muted"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-camel/10">
                      <Icon className="h-4 w-4 text-accent" />
                    </span>
                    <span className="flex-1 font-medium">{t.nav[item.id]}</span>
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-aria-selected:opacity-100" />
                  </CommandPrimitive.Item>
                );
              })}
            </CommandPrimitive.Group>
          </CommandPrimitive.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <kbd className="flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
              </kbd>
              {t.commandPalette.toNavigate}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="flex items-center gap-0.5">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              {t.commandPalette.toSelect}
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
=======
"use client";

import { useEffect } from "react";
import { Command as CommandPrimitive } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAV_ITEMS, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Quick navigation command palette.
 * Open with Cmd/Ctrl+K. Keyboard-first, premium, calm.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { navigate } = useNav();
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (id: ViewId) => {
    navigate(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border bg-background p-0 shadow-2xl sm:max-w-[520px]">
        <DialogTitle className="sr-only">{t.commandPalette.title}</DialogTitle>
        <CommandPrimitive className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              placeholder={t.commandPalette.placeholder}
              className="h-14 flex-1 bg-transparent text-sm text-ink placeholder:text-muted-foreground/70 focus:outline-none"
              autoFocus
            />
            <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-sm font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <CommandPrimitive.List className="max-h-[320px] overflow-y-auto p-2">
            <CommandPrimitive.Empty>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Logo size={40} />
                <p className="text-sm text-muted-foreground">
                  {t.commandPalette.emptyTitle}
                </p>
              </div>
            </CommandPrimitive.Empty>

            <CommandPrimitive.Group
              heading={t.commandPalette.pagesHeading}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandPrimitive.Item
                    key={item.id}
                    value={t.nav[item.id]}
                    onSelect={() => go(item.id)}
                    className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm text-ink aria-selected:bg-muted data-[selected=true]:bg-muted"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-camel/10">
                      <Icon className="h-4 w-4 text-accent" />
                    </span>
                    <span className="flex-1 font-medium">{t.nav[item.id]}</span>
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-aria-selected:opacity-100" />
                  </CommandPrimitive.Item>
                );
              })}
            </CommandPrimitive.Group>
          </CommandPrimitive.List>

          {/* Footer hint */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <kbd className="flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
              </kbd>
              {t.commandPalette.toNavigate}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="flex items-center gap-0.5">
                <CornerDownLeft className="h-3 w-3" />
              </kbd>
              {t.commandPalette.toSelect}
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
>>>>>>> 0d2d90e9f17bc15315fda8af6702b754efb3467d
