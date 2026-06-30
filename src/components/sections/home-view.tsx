"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ArchMotif, ArchGateway } from "@/components/brand/motif";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { SectionProgress } from "@/components/site/section-progress";
import { SectionReadingBar } from "@/components/site/section-reading-bar";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function HomeView() {
  const { navigate } = useNav();
  const { t } = useI18n();
  const practicalHelp = t.dir === "rtl"
    ? {
        eyebrow: "كيف نساعدك؟",
        title: "ماذا نفعل فعليًا؟",
        intro: "نساعدك على تحويل التحدي غير الواضح إلى قرار عملي وخطوة قابلة للتنفيذ.",
        cards: [
          {
            title: "نوضح المشكلة",
            text: "نساعدك على فهم أين الخلل الحقيقي قبل صرف المال على حلول عشوائية.",
          },
          {
            title: "نحدد الخطوة التالية",
            text: "نحوّل الوضع الحالي إلى قرار عملي واضح.",
          },
          {
            title: "نبني ما تحتاجه فقط",
            text: "موقع، نظام، هوية، أو خطة نمو — عندما تكون فعلًا هي الخطوة الصحيحة.",
          },
          {
            title: "نرافق التنفيذ",
            text: "نساعدك على التحرك بهدوء وبلا هدر، خطوة بعد خطوة.",
          },
        ],
      }
    : {
        eyebrow: "How we help you",
        title: "What we actually do",
        intro: "We help turn an unclear challenge into a practical decision and an actionable next step.",
        cards: [
          {
            title: "Clarify the real problem",
            text: "We help you understand where the actual bottleneck is before spending money on random solutions.",
          },
          {
            title: "Define the next step",
            text: "We turn the current situation into a clear practical decision.",
          },
          {
            title: "Build only what you need",
            text: "A website, system, identity, or growth plan — only when it is truly the right step.",
          },
          {
            title: "Support execution",
            text: "We help you move calmly, with less waste, one step at a time.",
          },
        ],
      };
  const howWeHelpTeaserEyebrow = t.dir === "rtl"
    ? "قبل أي قرار"
    : "Before any decision";
  const howWeHelpTeaserTitle = t.dir === "rtl"
    ? "استشارة، لا معاملات"
    : "Consultation, not transactions";
  const sectionProgressLabels = t.dir === "rtl"
    ? {
        home: "الرئيسية",
        practicalHelp: "كيف نساعدك؟",
        methodology: "منهجيتنا",
        howWeHelp: "قبل أي قرار",
        why: "لماذا سايبر ويل",
        principles: "كيف نفكر",
        faq: "أسئلة",
        cta: "شاركنا مشكلتك",
      }
    : {
        home: "Home",
        practicalHelp: "How we help you",
        methodology: "Methodology",
        howWeHelp: "Before any decision",
        why: "Why CyberWeel",
        principles: "How we think",
        faq: "FAQ",
        cta: "Share your challenge",
      };

  return (
    <div>
      {/* ───────────────── Hero (calm, trust-first, logo as anchor) ───────────────── */}
      <section id="hero" className="relative overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at 50% -20%, rgba(184,154,90,0.08), transparent 60%)",
          }}
        />

        <div className="cw-container relative grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex items-center gap-4"
            >
              <Logo size={48} />
              <span className="eyebrow-camel leading-none">{t.hero.eyebrow}</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate="show"
              className="mt-8 font-display text-[2rem] font-light leading-[1.12] tracking-tight text-ink [text-wrap:balance] xs:text-[2.4rem] sm:text-5xl lg:text-[4.25rem]"
            >
              <span className="block">{t.hero.titleLine1}</span>
              <span className="mt-1 block text-accent">{t.hero.titleLine2}</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              initial="hidden"
              animate="show"
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              {t.hero.promise}
            </motion.p>

            {/* Calm note — replaces the prominent CTA pair.
                The hero communicates value first; action is invited softly. */}
            <motion.p
              variants={fadeUp}
              custom={3}
              initial="hidden"
              animate="show"
              className="mt-8 flex items-center gap-2 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t.hero.calmNote}
            </motion.p>

            {/* Primary + secondary CTAs */}
            <motion.div
              variants={fadeUp}
              custom={4}
              initial="hidden"
              animate="show"
              className="mt-8"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={BRAND.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-camel px-6 text-base font-semibold text-ink transition hover:bg-camel/90"
                >
                  {t.hero.primaryCta}
                </a>
                <button
                  type="button"
                  onClick={() => navigate("share-challenge")}
                  className="focus-ring group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-white px-6 text-base font-semibold text-ink transition hover:bg-bone/40"
                >
                  {t.hero.secondaryCta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </button>
              </div>
              <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-muted-foreground">
                {t.hero.ctaNote}
              </p>
            </motion.div>
          </div>

          {/* The logo as architectural anchor — framed BY the arch gateway,
              with depth + transition glow (reference image qualities). */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden justify-self-center lg:block"
          >
            <div className="relative h-[560px] w-[560px]">
              {/* Transition glow behind the arch — a warm radial light
                  suggesting depth and forward movement (reference image). */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 42%, rgba(184,154,90,0.22), rgba(184,154,90,0.08) 38%, transparent 62%)",
                }}
              />
              {/* Inner depth panel — a soft nested frame within the arch
                  (arch-within-arch, like the reference image). */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[14%] rounded-[50%] rounded-b-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(17,24,39,0.05) 0%, rgba(184,154,90,0.06) 70%, rgba(17,24,39,0.02) 100%)",
                }}
              />

              {/* The arch gateway as the architectural frame */}
              <ArchGateway className="absolute inset-0" />

              {/* The logo centered as the keystone/anchor — large, present */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/logo-transparent.png"
                  alt="CyberWeel"
                  className="relative z-10 h-[260px] w-[260px] object-contain drop-shadow-[0_8px_24px_rgba(17,24,39,0.18)]"
                />
              </div>

              {/* Quiet label at the base plinth */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span className="text-sm font-medium tracking-[0.32em] text-muted-foreground uppercase">
                  {t.hero.panelLabel}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Compact mobile motif — the arch + logo anchor, scaled for small screens */}
          <motion.div
            variants={fadeUp}
            custom={5}
            initial="hidden"
            animate="show"
            className="relative mx-auto mt-6 h-[300px] w-[300px] lg:hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 42%, rgba(184,154,90,0.20), rgba(184,154,90,0.06) 40%, transparent 64%)",
              }}
            />
            <ArchGateway className="absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/logo-transparent.png"
                alt="CyberWeel"
                className="relative z-10 h-[140px] w-[140px] object-contain drop-shadow-[0_8px_24px_rgba(17,24,39,0.18)]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────────── Practical help ───────────────── */}
      <Section tone="floral" id="practical-help">
        <SectionHeading
          align="center"
          eyebrow={practicalHelp.eyebrow}
          title={practicalHelp.title}
          intro={practicalHelp.intro}
          className="mx-auto"
        />
        <div className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {practicalHelp.cards.map((card, i) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="group relative flex gap-5 rounded-xl border border-border bg-muted p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-camel/40 hover:shadow-lg hover:shadow-ink/[0.06] md:block"
            >
              <span className="inline-flex rounded-md bg-white px-3 py-1 font-display text-base font-medium tracking-[0.2em] text-ink shadow-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-2xl font-light text-ink sm:text-3xl">
                {card.title}
              </h3>
              <p className="mx-auto mt-5 max-w-xs text-lg leading-relaxed text-muted-foreground">
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ───────────────── Methodology ───────────────── */}
      <Section tone="muted" id="methodology" className="section-texture relative" before={<SectionReadingBar sectionId="methodology" />}>
        <SectionHeading
          align="center"
          eyebrow={t.methodology.eyebrow}
          title={t.methodology.title}
          intro={t.methodology.intro}
          className="mx-auto"
        />
        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute bottom-6 left-[34px] top-6 w-px bg-border md:hidden"
          />
          {t.methodology.steps.map((m, i) => (
            <motion.div
              key={m.step}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="group relative flex gap-5 rounded-xl border border-border bg-background p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-camel/40 hover:shadow-lg hover:shadow-ink/[0.06] md:block"
            >
              <span className="inline-flex rounded-md bg-white px-3 py-1 font-display text-base font-medium tracking-[0.2em] text-ink shadow-sm">
                0{m.step}
              </span>
              {/* The concept name — large, prominent, the visual heart of each card */}
              <h3 className="mt-4 font-display text-4xl font-light text-ink sm:text-5xl">
                {m.title}
              </h3>
              <p className="mx-auto mt-5 max-w-xs text-lg leading-relaxed text-muted-foreground">
                {m.description}
              </p>
              {i < t.methodology.steps.length - 1 && (
                <ArrowRight className="absolute -right-5 top-12 hidden h-5 w-5 text-bone rtl:rotate-180 md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ───────────────── How we help teaser ───────────────── */}
      <Section tone="floral" id="how-we-help">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            eyebrow={howWeHelpTeaserEyebrow}
            title={howWeHelpTeaserTitle}
            intro={t.howWeHelpTeaser.intro}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {t.howWeHelpTeaser.cards.map((card, i) => (
              <motion.button
                key={card.title}
                type="button"
                onClick={() => navigate("how-we-help")}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="focus-ring group rounded-xl border border-border bg-white p-7 text-center transition-all hover:border-camel/40 hover:shadow-sm"
              >
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-camel/10">
                  <span className="font-display text-base font-semibold text-accent">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-medium text-ink">
                  {card.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-muted-foreground">
                  {card.text}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </Section>

      {/* ───────────────── Philosophy / trust (no fake stats) ───────────────── */}
      <Section tone="ink" id="why" className="section-texture-dark relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.14]"
        >
          <ArchMotif size={520} onDark />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-8 h-px bg-floral/10 sm:inset-x-16"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 bottom-8 h-px bg-floral/10 sm:inset-x-16"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="eyebrow text-white/95">{t.philosophy.eyebrow}</p>
          <p className="mt-6 font-display text-3xl font-light leading-[1.2] text-white sm:text-4xl lg:text-[2.75rem]">
            {t.philosophy.statement}
          </p>
          <p className="mt-7 text-lg leading-relaxed text-white/80">
            {t.philosophy.body}
          </p>
          <div className="mt-12 inline-flex flex-col items-center gap-3">
            <Logo onDark size={56} />
            <p className="font-display text-base text-white/70">
              {t.philosophy.note}
            </p>
          </div>
        </div>
      </Section>

      {/* ───────────────── Principles — editorial layout, not cards ───────────────── */}
      <Section tone="floral" id="principles">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <SectionHeading
            eyebrow={t.principles.eyebrow}
            title={t.principles.title}
            intro={t.principles.intro}
          />
          {/* Editorial numbered list — large numerals, generous whitespace,
              no card containers. Reduces the "card after card" feeling. */}
          <ol className="relative">
            <span
              aria-hidden
              className="absolute bottom-2 top-2 w-px bg-border rtl:right-0 ltr:left-0"
            />
            {t.principles.items.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative flex items-start gap-6 py-7 rtl:pr-8 ltr:pl-8"
              >
                <span className="font-display text-2xl font-light text-bone transition-colors duration-300 group-hover:text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-xl font-medium text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {p.text}
                  </p>
                </div>
                {/* keystone node on the timeline */}
                <span
                  aria-hidden
                  className="absolute top-9 h-2.5 w-2.5 -translate-x-1/2 rtl:translate-x-1/2 rotate-45 border border-camel bg-background transition-colors duration-300 group-hover:bg-camel ltr:left-0 rtl:right-0"
                />
              </motion.li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ───────────────── FAQ ───────────────── */}
      <Section tone="floral" id="faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            eyebrow={t.faq.eyebrow}
            title={t.faq.title}
            intro={t.faq.intro}
          />
          <div className="rounded-2xl border border-border bg-white p-2 sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {t.faq.items.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-border last:border-b-0"
                >
                  <AccordionTrigger className="px-4 py-5 text-start font-display text-lg font-medium text-ink hover:no-underline hover:text-accent">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-5 text-base leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </Section>

      {/* ───────────────── Closing CTA — exact two-column card structure ───────────────── */}
      <section id="share-challenge" className="cw-container py-10 sm:py-12">
        <div className="grid overflow-hidden rounded-2xl border border-border bg-white shadow-sm lg:grid-cols-2">
          {/* Image side */}
          <div className="relative min-h-[260px] bg-floral lg:min-h-[420px]">
            <img
              src="/closing-image.png"
              alt="CyberWeel"
              className="h-full w-full object-cover object-left"
            />
          </div>

          {/* Content side */}
          <div className="flex flex-col items-center justify-center px-8 py-12 text-center sm:px-12 lg:px-16">
            <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">
              {t.dir === "rtl" ? "هل أنت مستعد لرؤية الصورة بوضوح أكثر؟" : "Are you ready to see the picture more clearly?"}
            </h2>

            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              ابدأ محادثة قصيرة وسنساعدك على رسم الخطوة التالية
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={BRAND.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-camel px-6 text-base font-semibold text-ink transition hover:bg-camel/90"
              >
                <span>ابدأ محادثة واتساب</span>
              </a>

              <a
                href="#contact"
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-6 text-base font-semibold text-ink transition hover:bg-bone/40"
              >
                احجز استشارة
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        [aria-label="Section progress"] button[aria-label="Jump to Why CyberWeel"][aria-current="true"] span:first-child,
        [aria-label="Section progress"] button[aria-label="Jump to لماذا سايبر ويل"][aria-current="true"] span:first-child {
          color: rgb(255 255 255 / 0.96) !important;
        }

        [aria-label="Section progress"] > div > span {
          color: hsl(var(--accent)) !important;
          opacity: 1;
        }
      `}</style>

      {/* Quiet right-rail section progress (desktop only) */}
      <SectionProgress
        sections={[
          { id: "hero", label: sectionProgressLabels.home },
          { id: "practical-help", label: sectionProgressLabels.practicalHelp },
          { id: "methodology", label: sectionProgressLabels.methodology },
          { id: "how-we-help", label: sectionProgressLabels.howWeHelp },
          { id: "why", label: sectionProgressLabels.why },
          { id: "principles", label: sectionProgressLabels.principles },
          { id: "faq", label: sectionProgressLabels.faq },
          { id: "share-challenge", label: sectionProgressLabels.cta },
        ]}
      />
    </div>
  );
}
