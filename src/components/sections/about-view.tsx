"use client";

import { motion } from "framer-motion";
import { Compass, Check, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { FadeIn } from "@/components/site/fade-in";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

export function AboutView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const a = t.about;
  const isArabic = t.dir === "rtl";

  return (
    <div>
      <PageHeader
        eyebrow={a.eyebrow}
        title={
          <>
            {a.titleLine1}
            <br />
            <span className="text-accent">{a.titleLine2}</span>
          </>
        }
        intro={a.intro}
        actions={<ShareAction view={view} />}
      />

      {/* Philosophy */}
      <Section tone="muted" className="!pt-0">
        <div className="mx-auto max-w-3xl text-center">
          <Compass className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-6 font-display text-3xl font-light leading-tight text-ink sm:text-4xl">
            {a.philosophyTitle}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {a.philosophyBody1}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {a.philosophyBody2}
          </p>
        </div>

        {/* Why we started */}
        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-camel/30 bg-background p-8 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-camel" aria-hidden />
                <p className="eyebrow-camel">
                  {isArabic ? "لماذا بدأنا؟" : "Why we started"}
                </p>
              </div>
              <h2 className="mt-5 font-display text-3xl font-light leading-tight text-ink sm:text-4xl">
                {isArabic
                  ? "لأن التنفيذ قبل الفهم يكلّف أكثر مما يبدو"
                  : "Because execution before clarity costs more than it appears"}
              </h2>
            </div>

            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                {isArabic
                  ? "بدأت CyberWeel من ملاحظة تتكرر كثيرًا: أصحاب أعمال يملكون طموحًا وإمكانات حقيقية، لكنهم يدخلون في موقع جديد أو نظام أو حملة قبل أن تتضح المشكلة التي يحاولون حلها فعلًا"
                  : "CyberWeel began with a recurring observation: capable business owners often invest in a new website, system, or campaign before the real problem is clearly understood"}
              </p>
              <p>
                {isArabic
                  ? "النتيجة تكون وقتًا ومالًا يُصرفان على تنفيذ جيد ربما، لكنه لا يعالج أصل المشكلة ولا ينقل المشروع إلى المرحلة التالية"
                  : "The result can be good execution that still fails to address the root issue or move the business forward"}
              </p>
              <p className="font-medium text-ink">
                {isArabic
                  ? "لهذا وُجدت CyberWeel: لنفهم أولًا، نختار القرار الصحيح، ثم نبني فقط ما يحتاجه المشروع فعلًا"
                  : "That is why CyberWeel exists: understand first, choose the right decision, then build only what the business truly needs"}
              </p>
            </div>
          </div>
        </div>

        {/* Methodology expansion */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {t.methodology.steps.map((m, i) => (
            <motion.div
              key={m.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-background p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-camel/40 hover:shadow-lg hover:shadow-ink/[0.06]"
            >
              <span className="font-display text-2xl text-accent">
                {m.title}
              </span>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {m.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Who we are / aren't */}
      <Section tone="floral">
        <div className="grid gap-10 lg:grid-cols-2">
          <FadeIn delay={0}>
            <div className="h-full rounded-2xl border border-camel/30 bg-camel/5 p-8 sm:p-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-camel/15">
                <Check className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium text-ink">
                {a.weAreTitle}
              </h3>
              <ul className="mt-5 space-y-3">
                {a.weAre.map((w) => (
                  <li
                    key={w}
                    className="flex items-start gap-3 text-base text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="h-full rounded-2xl border border-border bg-muted/40 p-8 sm:p-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium text-ink">
                {a.weAreNotTitle}
              </h3>
              <ul className="mt-5 space-y-3">
                {a.weAreNot.map((w) => (
                  <li
                    key={w}
                    className="flex items-start gap-3 text-base text-muted-foreground"
                  >
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* Who we help */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="flex flex-col items-start gap-6">
            <Logo onDark size={64} />
            <p className="font-display text-lg text-bone/70">
              {t.brandTagline}
            </p>
          </div>
          <div>
            <SectionHeading
              onDark
              eyebrow={a.whoWeHelpEyebrow}
              title={a.whoWeHelpTitle}
              intro={a.whoWeHelpIntro}
            />
            <p className="mt-6 text-base leading-relaxed text-bone/75">
              {a.whoWeHelpBody}
            </p>
            <div className="mt-10">
              <PrimaryCta onClick={() => navigate("share-challenge")}>
                {a.cta}
              </PrimaryCta>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
