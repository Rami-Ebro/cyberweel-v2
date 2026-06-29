"use client";

import { motion } from "framer-motion";
import {
  Eye,
  MonitorSmartphone,
  Gem,
  TrendingUp,
  Settings2,
  HandHeart,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

const AREA_ICONS = [Eye, MonitorSmartphone, Gem, TrendingUp, Settings2, HandHeart];

export function HowWeHelpView() {
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

      {/* Areas */}
      <Section tone="muted" className="section-texture">
        <SectionHeading
          eyebrow={h.areasEyebrow}
          title={h.areasTitle}
          intro={h.areasIntro}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {h.areas.map((a, i) => {
            const Icon = AREA_ICONS[i] ?? Eye;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="group relative rounded-xl border border-border bg-background p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/40 hover:shadow-lg hover:shadow-ink/[0.06]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-camel/10 transition-colors duration-300 group-hover:bg-camel/20">
                  <Icon className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mt-5 font-display text-xl font-medium text-ink">
                  {a.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {a.text}
                </p>
                <span className="absolute bottom-0 left-7 h-[2px] w-0 bg-accent transition-all duration-300 group-hover:w-[calc(100%-3.5rem)]" aria-hidden />
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Process */}
      <Section tone="floral">
        <SectionHeading
          align="center"
          eyebrow={h.processEyebrow}
          title={h.processTitle}
          intro={h.processIntro}
          className="mx-auto"
        />

        {/* Mobile/tablet vertical timeline */}
        <div className="relative mt-14 lg:hidden">
          <div
            aria-hidden
            className="absolute bottom-2 left-[27px] top-2 w-px bg-border"
          />
          <ol className="space-y-8">
            {h.process.map((p, i) => (
              <motion.li
                key={p.n}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex gap-5"
              >
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-background font-display text-xl font-light text-ink">
                  {p.n}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-display text-xl font-medium text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {p.text}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Desktop horizontal timeline */}
        <div className="relative mt-16 hidden lg:grid lg:grid-cols-4 lg:gap-8">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 h-px bg-border"
            style={{ marginInline: "12%" }}
          />
          {h.process.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative"
            >
              <div className="flex items-center gap-4">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background font-display text-xl font-light text-ink transition-all duration-300 group-hover:border-camel group-hover:text-accent">
                  {p.n}
                </span>
              </div>
              <div className="mt-5 h-px w-10 bg-accent transition-all duration-300 group-hover:w-16" />
              <h3 className="mt-4 font-display text-xl font-medium text-ink">
                {p.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {p.text}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Honesty note */}
      <Section tone="ink">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-bone/60">{h.honestyEyebrow}</p>
          <p className="mt-6 font-display text-2xl font-light leading-relaxed text-floral sm:text-3xl">
            {h.honestyStatement}
          </p>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-bone/75">
            {h.honestyBody.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <PrimaryCta onClick={() => navigate("share-challenge")}>
              {h.honestyCta}
            </PrimaryCta>
            <button
              type="button"
              onClick={() => navigate("about")}
              className="focus-ring inline-flex items-center gap-2 text-base font-medium text-bone/80 transition-colors hover:text-floral"
            >
              {h.honestySecondary}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
