"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNav } from "@/components/site/nav-context";
import { BRAND } from "@/lib/site-data";

export function FinalHero({ copy, methodology }: { copy: any; methodology: string }) {
  const { navigate } = useNav();

  return (
    <section id="hero" className="relative overflow-hidden bg-[#ece7da]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 75% at 20% 48%, rgba(247,243,235,0.92), transparent 68%), linear-gradient(125deg, #f7f3eb 0%, #ece7da 55%, #d8d2c4 100%)",
        }}
      />

      <div className="cw-container relative z-10 grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <p className="eyebrow-camel">{copy.eyebrow}</p>
          <h1 className="mt-8 font-display text-[2rem] font-normal leading-[1.12] tracking-tight text-ink xs:text-[2.4rem] sm:text-5xl lg:text-[4.25rem]">
            <span className="block">{copy.title1}</span>
            <span className="mt-1 block text-accent">{copy.title2}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{copy.promise}</p>
          <p className="mt-5 max-w-2xl border-s-2 border-camel ps-4 text-base font-semibold leading-relaxed text-ink/85 sm:text-lg">{copy.execution}</p>
          <p className="mt-6 text-base font-semibold leading-relaxed text-ink">{copy.note}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={BRAND.social.whatsapp} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-camel px-6 text-base font-semibold text-ink transition hover:bg-camel/90">
              {copy.primary}
            </a>
            <button type="button" onClick={() => navigate("share-challenge")} className="cta-bounce focus-ring group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-ink/15 bg-white/30 px-6 text-base font-semibold text-ink backdrop-blur-sm transition hover:bg-white/50">
              {copy.secondary}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
          </div>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{copy.ctaNote}</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto hidden h-[540px] w-[540px] lg:flex lg:flex-col lg:items-center lg:justify-center">
          <img
            src="/cyberweel-logo-20260720.svg"
            alt="CyberWeel"
            className="h-auto w-full max-w-[520px] object-contain drop-shadow-[0_16px_30px_rgba(17,24,39,0.16)]"
          />
          <p dir="ltr" className="mt-5 text-base font-semibold tracking-wide text-ink/70">
            {methodology}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
