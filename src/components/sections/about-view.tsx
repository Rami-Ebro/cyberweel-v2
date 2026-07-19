"use client";

import { motion } from "framer-motion";
import { Compass, Check, X, Store } from "lucide-react";
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
  const ar = t.dir === "rtl";

  const projectItems = ar
    ? [
        "تحسين بنية المتجر وتجربة التصفح",
        "تبسيط رحلة الشراء من صفحة المنتج إلى إتمام الطلب",
        "معالجة المشكلات التي تعيق الاستخدام",
        "توضيح دعوات الشراء والمعلومات المهمة",
        "بناء أساس قابل للتطوير والتسويق لاحقًا",
      ]
    : [
        "Improve the store structure and browsing experience",
        "Simplify the buying journey from product page to checkout",
        "Resolve usability blockers",
        "Clarify purchase actions and essential information",
        "Build a foundation ready for future growth and marketing",
      ];

  return (
    <div>
      <PageHeader
        eyebrow={a.eyebrow}
        title={<>{a.titleLine1}<br /><span className="text-accent">{a.titleLine2}</span></>}
        intro={a.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="muted" className="!pt-14 sm:!pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Compass className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-6 font-display text-3xl font-light leading-tight text-ink sm:text-4xl">{a.philosophyTitle}</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{a.philosophyBody1}</p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{a.philosophyBody2}</p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-camel/30 bg-background p-8 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="eyebrow-camel">{ar ? "لماذا نحن موجودون؟" : "Why we exist"}</p>
              <h2 className="mt-5 font-display text-3xl font-light leading-tight text-ink sm:text-4xl">
                {ar ? "لأن التنفيذ قبل الفهم يكلّف أكثر مما يبدو" : "Because execution before clarity costs more than it appears"}
              </h2>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>{ar ? "بدأت CyberWeel من ملاحظة تتكرر كثيرًا: أصحاب أعمال يملكون طموحًا وإمكانات حقيقية، لكنهم يبدأون بموقع أو نظام أو حملة قبل أن تتضح المشكلة التي يريدون حلها فعلًا" : "CyberWeel began with a recurring observation: capable business owners often invest in a website, system, or campaign before the real problem is clearly understood"}</p>
              <p>{ar ? "النتيجة تكون وقتًا ومالًا يُصرفان على تنفيذ قد يكون جيدًا، لكنه لا يعالج أصل المشكلة ولا ينقل المشروع إلى المرحلة التالية" : "The result can be good execution that still fails to address the root issue or move the business forward"}</p>
              <p className="font-medium text-ink">{ar ? "لهذا وُجدت CyberWeel: لنفهم أولًا، ثم نختار القرار الصحيح، ثم نبني ما يحتاجه المشروع فعلًا" : "That is why CyberWeel exists: understand first, choose the right decision, then build only what the business truly needs"}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {t.methodology.steps.map((m, i) => (
            <motion.div key={m.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.1 }} className="rounded-xl border border-border bg-background p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-camel/40 hover:shadow-lg">
              <span className="font-display text-2xl text-accent">{m.title}</span>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{m.description}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section tone="background">
        <SectionHeading
          align="center"
          eyebrow={ar ? "تطبيق عملي لمنهجيتنا" : "Our methodology in practice"}
          title={ar ? "مشاريع قيد الإنشاء" : "Projects in progress"}
          intro={ar ? "نشارك ما نبنيه بصدق، حتى قبل اكتمال المشروع" : "We share what we are building honestly, even before completion"}
          className="mx-auto"
        />
        <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto mt-12 max-w-5xl rounded-2xl border border-camel/30 bg-background p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel/10"><Store className="h-6 w-6 text-accent" /></div>
              <p className="mt-6 text-sm font-bold text-accent">SelaMaro</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-ink">{ar ? "متجر إلكتروني قيد الإنشاء" : "E-commerce store in progress"}</h3>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-muted-foreground">{ar ? "في مشروع SelaMaro لم نبدأ بالتصميم أو إضافة الخصائص مباشرة. بدأنا بمراجعة تجربة العميل، وتنظيم أقسام المتجر، وفحص رحلة الشراء من صفحة المنتج حتى إتمام الطلب" : "For SelaMaro, we did not begin with design or features. We started by reviewing the customer experience, store structure, and the buying journey from product page to checkout"}</p>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{ar ? "خلال ذلك ظهرت نقاط تحتاج إلى معالجة، فأُعيد ترتيب الأولويات وأصبح التطوير يسير وفق خطوات أوضح" : "That review revealed important issues, allowing us to reorder priorities and move development forward with greater clarity"}</p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {projectItems.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</li>)}
              </ul>
            </div>
          </div>
        </motion.article>
      </Section>

      <Section tone="floral">
        <div className="grid gap-10 lg:grid-cols-2">
          <FadeIn delay={0}><div className="h-full rounded-2xl border border-camel/30 bg-camel/5 p-8 sm:p-10"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-camel/15"><Check className="h-5 w-5 text-accent" /></div><h3 className="mt-5 font-display text-2xl font-medium text-ink">{a.weAreTitle}</h3><ul className="mt-5 space-y-3">{a.weAre.map((w) => <li key={w} className="flex items-start gap-3 text-base text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{w}</li>)}</ul></div></FadeIn>
          <FadeIn delay={0.12}><div className="h-full rounded-2xl border border-border bg-muted/40 p-8 sm:p-10"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted"><X className="h-5 w-5 text-muted-foreground" /></div><h3 className="mt-5 font-display text-2xl font-medium text-ink">{a.weAreNotTitle}</h3><ul className="mt-5 space-y-3">{a.weAreNot.map((w) => <li key={w} className="flex items-start gap-3 text-base text-muted-foreground"><X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />{w}</li>)}</ul></div></FadeIn>
        </div>
      </Section>

      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="flex flex-col items-start gap-6"><Logo onDark size={64} /><p className="font-display text-lg text-bone/70">{t.brandTagline}</p></div>
          <div><SectionHeading onDark eyebrow={a.whoWeHelpEyebrow} title={a.whoWeHelpTitle} intro={a.whoWeHelpIntro} /><p className="mt-6 text-base leading-relaxed text-bone/75">{a.whoWeHelpBody}</p><div className="mt-10"><PrimaryCta onClick={() => navigate("share-challenge")}>{a.cta}</PrimaryCta></div></div>
        </div>
      </Section>
    </div>
  );
}
