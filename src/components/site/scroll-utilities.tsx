"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/site/i18n";

/**
 * Two quiet utilities:
 *  - A slim camel scroll-progress bar pinned to the very top.
 *  - A back-to-top button that fades in after the user scrolls.
 */
export function ScrollUtilities() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const [showTop, setShowTop] = useState(false);
  const { t, dir } = useI18n();

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-camel"
        aria-hidden
      />

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.25 }}
            aria-label={t.scrollUtilities.backToTop}
            className={cn(
              "focus-ring fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-camel/40 bg-ink text-camel shadow-lg transition-colors hover:bg-ink/90"
            )}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
