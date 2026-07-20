"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ArchGateway } from "@/components/brand/motif";
import { useNav } from "@/components/site/nav-context";
import { BRAND } from "@/lib/site-data";

export function FinalHero({ copy, methodology }: { copy: any; methodology: string }) {
  const { navigate } = useNav();

  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      <div className="cw-container grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
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
            <button type="button" onClick={() => navigate("share-challenge")} className="cta-bounce focus-ring group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-white px-6 text-base font-semibold text-ink transition hover:bg-bone/40">
              {copy.secondary}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
          </div>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{copy.ctaNote}</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto hidden h-[500px] w-[500px] lg:block">
          <ArchGateway className="absolute inset-0" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img src="/logo-transparent.png" alt="CyberWeel" className="h-[230px] w-[230px] object-contain drop-shadow-[0_8px_24px_rgba(17,24,39,0.18)]" />
            <p dir="ltr" className="mt-4 text-sm font-semibold tracking-wide text-ink/70">
              {methodology}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}