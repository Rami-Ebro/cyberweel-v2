"use client";

import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/site-data";

/**
 * Social links — Facebook, Telegram, WhatsApp.
 * Branded icons in a quiet row, consistent with the calm identity.
 */
export function SocialLinks({
  onDark = false,
  className,
  size = "md",
}: {
  onDark?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  const links = [
    { href: BRAND.social.facebook, label: "Facebook", icon: FacebookIcon },
    { href: BRAND.social.telegram, label: "Telegram", icon: TelegramIcon },
    { href: BRAND.social.whatsapp, label: "WhatsApp", icon: WhatsAppGlyph },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            "focus-ring inline-flex items-center justify-center rounded-full border transition-colors",
            dim,
            onDark
              ? "border-floral/15 text-bone/80 hover:border-camel/50 hover:text-camel"
              : "border-border text-muted-foreground hover:border-camel/50 hover:text-accent"
          )}
        >
          <Icon className={iconSize} />
        </a>
      ))}
    </div>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2H8.2V14h2.3v7h3z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M9.2 14.3 9 18.4c.4 0 .6-.2.8-.4l2-1.9 4.1 3c.8.4 1.3.2 1.5-.7l2.7-12.6v-.1c.2-1.1-.4-1.5-1.2-1.2L4.4 10.5c-1.1.4-1.1 1-.2 1.3l3.9 1.2 9.1-5.7c.4-.3.8-.1.5.2l-7.5 6.8z" />
    </svg>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4 0 .5l-.4.5c-.1.2-.2.3 0 .6.2.4.7 1.2 1.4 1.7.9.7 1.6.9 1.8 1 .2 0 .3 0 .5-.2l.4-.5c.2-.2.4-.2.6-.1l1.5.8c.2.1.3.2.3.4 0 .5-.2 1.2-.5 1.4-.3.3-1 .6-1.7.6-.4 0-.9-.1-1.5-.3-1-.3-2-.8-3-1.7-1-.9-1.7-1.9-2.2-2.9-.3-.6-.5-1.2-.5-1.7 0-.7.3-1.3.6-1.6.2-.2.5-.4.8-.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
