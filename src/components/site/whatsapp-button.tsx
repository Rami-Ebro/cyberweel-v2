"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Floating WhatsApp button — premium, non-intrusive.
 * Branded with Ink + Camel (not generic bright green).
 * Appears after a short scroll. Opens WhatsApp directly.
 */
export function WhatsAppButton({
  number,
  message,
  className,
}: {
  number: string;
  message?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = `https://wa.me/${number.replace(/[^0-9]/g, "")}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 10 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-camel/40 bg-ink text-camel shadow-lg transition-colors hover:bg-ink/90",
            className
          )}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5 text-camel" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

/** Branded WhatsApp glyph — matches the calm Ink + Camel identity. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
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
