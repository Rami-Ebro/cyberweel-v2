"use client";

import { motion } from "framer-motion";
import { ArchMotif, KeystoneDivider } from "@/components/brand/motif";
import { useI18n } from "@/components/site/i18n";
import { Section } from "@/components/site/section-primitives";

/**
 * Transition — a memorable visual destination near the end of the homepage.
 * Uses the reference image directly (not as a background overlay): image on
 * one side, content on the other. Reinforces "from where you are… to where
 * you want to be" and "Clarity → Decision → Progress".
 */
export function TransitionSection() {
  const { t, dir } = useI18n();
  const tr = t.transition;

  return (
    <Section tone="ink" className="relative overflow-hidden">
      {/* Quiet depth: radial warm glow + arch motif backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 70% at 25% 50%, rgba(184,154,90,0.12), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 opacity-[0.05]"
      >
        <ArchMotif size={420} onDark />
      </div>

      <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Image — the visible, important element (not a background overlay) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={dir === "rtl" ? "order-2 lg:order-1" : "order-1"}
        >
          <div className="relative overflow-hidden rounded-2xl border border-floral/10 shadow-2xl">
            <img
              src="/final-cta.webp"
              alt={tr.title}
              className="h-[420px] w-full object-cover sm:h-[480px] lg:h-[560px]"
            />
            {/* subtle inner frame */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-3 rounded-xl border border-floral/10"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className={dir === "rtl" ? "order-1 lg:order-2" : "order-2"}
        >
          <KeystoneDivider onDark className="!justify-start" />
          <p className="mt-6 eyebrow-camel">{tr.eyebrow}</p>
          <h2 className="mt-5 font-display text-3xl font-light leading-[1.15] text-floral sm:text-4xl lg:text-[2.75rem]">
            {tr.title}
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-bone/80">
            {tr.body}
          </p>

          {/* From → To transition line */}
          <div className="mt-8 flex items-center gap-4">
            <span className="font-display text-base text-bone/60">
              {tr.from}
            </span>
            <span aria-hidden className="h-px flex-1 max-w-[60px] bg-camel/50" />
            <span className="font-display text-base font-medium text-camel">
              {tr.to}
            </span>
          </div>

          {/* Methodology reinforcement */}
          <p className="mt-8 font-display text-lg font-medium tracking-wide text-floral">
            {tr.methodology}
          </p>
        </motion.div>
      </div>
    </Section>
  );
}
