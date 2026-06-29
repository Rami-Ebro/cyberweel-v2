"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { useI18n } from "@/components/site/i18n";

/**
 * Help dialog listing all keyboard shortcuts.
 * Opens with the "?" key. Calm, premium, brand-consistent.
 */
export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const SHORTCUTS = t.shortcuts.items;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background p-0 shadow-2xl sm:max-w-[480px]">
        <DialogTitle className="sr-only">{t.shortcuts.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t.shortcuts.subtitle}
        </DialogDescription>
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-camel/10">
            <Keyboard className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="font-display text-lg font-medium text-ink">
              {t.shortcuts.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.shortcuts.subtitle}
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-4 px-6 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{s.label}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.desc}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-border bg-muted px-2 text-sm font-medium text-ink"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
          {t.shortcuts.close.replace("Press ", "").replace("اضغط ", "")}
        </div>
      </DialogContent>
    </Dialog>
  );
}
=======
"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { useI18n } from "@/components/site/i18n";

/**
 * Help dialog listing all keyboard shortcuts.
 * Opens with the "?" key. Calm, premium, brand-consistent.
 */
export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const SHORTCUTS = t.shortcuts.items;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background p-0 shadow-2xl sm:max-w-[480px]">
        <DialogTitle className="sr-only">{t.shortcuts.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t.shortcuts.subtitle}
        </DialogDescription>
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-camel/10">
            <Keyboard className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="font-display text-lg font-medium text-ink">
              {t.shortcuts.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t.shortcuts.subtitle}
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-4 px-6 py-3.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{s.label}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.desc}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded border border-border bg-muted px-2 text-sm font-medium text-ink"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
          {t.shortcuts.close.replace("Press ", "").replace("اضغط ", "")}
        </div>
      </DialogContent>
    </Dialog>
  );
}
