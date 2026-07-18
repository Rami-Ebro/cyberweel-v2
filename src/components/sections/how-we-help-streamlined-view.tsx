"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={
          <>
            {h.titleLine1}
            <br />
            <span className="text-accent">{h.titleLine2}</span>
          </>
        }
        intro={h.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <SectionHeading
          align="center"
          eyebrow={h.processEyebrow}
          title={h.processTitle}
          intro={h.processIntro}
          className="mx-auto"
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
          {h.process.map((p, index) => (
            <motion.article
              key={p.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
              className="group rounded-xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
                {p.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {p.text}
              </p>
              <div className="mt-5 border-t border-border/70 pt-4">
                <span className="block h-px w-10 bg-accent/50 transition-all duration-300 group-hover:w-16" aria-hidden />
              </div>
            </motion.article>
          ))}
        </div>
     