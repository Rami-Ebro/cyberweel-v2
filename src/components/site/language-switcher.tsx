"use client";

import { useI18n } from "@/components/site/i18n";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

/**
 * Quiet language switcher. Toggles between Arabic (default) and English.
 * Shows the *other* language's name as the label (so AR view shows "EN").
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={cn(
        "focus-ring inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-camel/40 hover:bg-muted hover:text-ink",
        className
      )}
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Languages className="h-3.5 w-3.5 text-accent" />
      <span>{lang === "ar" ? "EN" : "ع"}</span>
    </button>
  );
}
