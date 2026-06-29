<<<<<<< HEAD
"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/site-data";
import { useI18n } from "@/components/site/i18n";

/**
 * Quiet "share this page" action.
 * Uses the native Web Share API where available, with a clipboard
 * fallback. Calm, premium, no popups.
 */
export function ShareAction({
  view,
  className,
}: {
  view: ViewId;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `CyberWeel — ${t.nav[view]}`;
    const text = `${BRAND_NAME} — ${t.brandTagline}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.share.successTitle, { description: t.share.successDesc });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.share.errorTitle, { description: t.share.errorDesc });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "focus-ring inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-camel/40 hover:text-ink",
        className
      )}
      aria-label={t.share.label}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-accent" />
          {t.share.copied}
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          {t.share.label}
        </>
      )}
    </button>
  );
}

/** Compact icon-only share button for tighter spaces. */
export function ShareIconButton({
  view,
  className,
}: {
  view: ViewId;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `CyberWeel — ${t.nav[view]}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: t.brandTagline, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.share.successTitle);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.share.errorTitle);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-camel/40 hover:text-ink",
        className
      )}
      aria-label={t.share.label}
    >
      {copied ? <Check className="h-4 w-4 text-accent" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

const BRAND_NAME = "CyberWeel";
=======
"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/site-data";
import { useI18n } from "@/components/site/i18n";

/**
 * Quiet "share this page" action.
 * Uses the native Web Share API where available, with a clipboard
 * fallback. Calm, premium, no popups.
 */
export function ShareAction({
  view,
  className,
}: {
  view: ViewId;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `CyberWeel — ${t.nav[view]}`;
    const text = `${BRAND_NAME} — ${t.brandTagline}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.share.successTitle, { description: t.share.successDesc });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.share.errorTitle, { description: t.share.errorDesc });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "focus-ring inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-camel/40 hover:text-ink",
        className
      )}
      aria-label={t.share.label}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-accent" />
          {t.share.copied}
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          {t.share.label}
        </>
      )}
    </button>
  );
}

/** Compact icon-only share button for tighter spaces. */
export function ShareIconButton({
  view,
  className,
}: {
  view: ViewId;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `CyberWeel — ${t.nav[view]}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: t.brandTagline, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t.share.successTitle);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.share.errorTitle);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-camel/40 hover:text-ink",
        className
      )}
      aria-label={t.share.label}
    >
      {copied ? <Check className="h-4 w-4 text-accent" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

const BRAND_NAME = "CyberWeel";
>>>>>>> 0d2d90e9f17bc15315fda8af6702b754efb3467d
