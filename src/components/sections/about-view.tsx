"use client";

import { motion } from "framer-motion";
import { Check, Compass, Store } from "lucide-react";
import { AboutIdentitySection } from "@/components/sections/about-identity-section";
import { AboutWhoWeHelpSection } from "@/components/sections/about-who-we-help-section";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { ShareAction } from "@/components/site/share-action";
import { useI18n } from "@/components/site/i18n";
import { useNav } from "@/components/site/nav-context";

const STEPS_AR = [
  ["وضوح", "نبدأ بفهم وضعك الحالي من خلال الإصغاء، والتقييم الصادق، من دون افتراضات مسبقة"],
  ["قرار", "نحدّد معك المسار الأنسب، بناءً على واقع مشروعك وهدفه، لا بناءً على رد فعل متسرع"],
  ["تقدّم", "تحرّك مدروس نحو هدفك، بخطوات ثابتة وقابلة للقياس والاستمرار"],
] as const;

const STEPS_EN = [
  ["Clarity", "We begin by understanding the current situation, the real constraint, and the outcome you are trying to achieve."],
  ["Decision", "We compare the realistic options and choose the direction that best fits the business, its resources, and its priorities."],
  ["Progress", "We turn that decision into deliberate, measurable action that can continue beyond a single launch or project."],
] as const;

const PROJECT_AR = [
  "تحسين بنية المتجر وتجربة التصفح",
  "تبسيط رحلة الشراء من صفحة المنتج إلى إتمام الطلب",
  "معالجة المشكلات التي تعيق الاستخدام",
  "توضيح دعوات الشراء والمعلومات المهمة",
  "بناء أساس قابل للتطوير والتسويق لاحقًا",
] as const;

const PROJECT_EN = [
  "Restructure store sections and product discovery",
  "Simplify the journey from product page to completed order",
  "Remove usability and navigation friction",
  "Clarify purchase actions and essential information",
  "Create a stronger foundation for future growth and marketing",
] as const;

const ABOUT_EN = {
  eyebrow: "About CyberWeel",
  titleLine1: "A partner in progress —",
  titleLine2: "not just another digital agency",
  intro:
    "CyberWeel helps business owners and teams understand what is holding them back, make sound decisions, and build the digital solutions their next stage genuinely requires.",
  weAreTitle: "What CyberWeel is",
  weAre: [
    "A partner that begins with the business problem, not a predetermined service",
    "A team that can assess, plan, build, improve, and protect digital solutions",
    "A practical bridge between strategic decisions and responsible execution",
  ],
  weAreNotTitle: "What CyberWeel is not",
  weAreNot: [
    "A catalogue of fixed packages pushed regardless of need",
    "A source of inflated promises, artificial urgency, or unnecessary scope",
    "A team that disappears once the first version is delivered",
  ],
  whoWeHelpEyebrow: "Who we work with",
  whoWeHelpTitle: "For businesses facing an important next step",
  whoWeHelpIntro:
    "We work best with owners, founders, and teams who need to decide what to build, improve, automate, secure, or stop doing.",
  whoWeHelpBody:
    "You do not need to arrive with a polished brief. You only need a real situation, an important decision, or a problem worth understanding properly.",
  cta: "Share your situation",
} as const;

export function AboutView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const ar = t.dir === "rtl";
  const a = ar ? t.about : ABOUT_EN;
  const steps = ar ? STEPS_AR : STEPS_EN;
  const project = ar ? PROJECT_AR : PROJECT_EN;

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

      <Section tone="muted" className="!pt-14 sm:!pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Compass className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-6 font-display text-3xl font-light leading-tight text-ink sm:text-4xl">
            {ar ? "معظم المؤسسات لا تفشل بسبب قلّة الجهد" : "Most businesses do not struggle because people are not trying hard enough"}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {ar
              ? "لكنها قد تفقد اتجاهها بسبب القرارات المتسرعة، وضغط العمل، وكثرة الآراء والمقترحات المتضاربة"
              : "They lose direction when pressure, conflicting advice, and rushed decisions replace a clear understanding of the real problem."}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {ar
              ? "فتنشغل بالحركة، من دون أن تتأكد أنها تتحرك نحو الهدف الصحيح"
              : "The result is often a great deal of activity without enough confidence that the business is moving toward the right outcome."}
          </p>
          <p className="mt-7 text-lg font-medium leading-relaxed text-ink">
            {ar
              ? "بُنيت CyberWeel حول فكرة مختلفة: أن التقدّم الحقيقي يبدأ بالوضوح، ويعتمد على قرار صائب، ويستمر من خلال تحرّك مدروس"
              : "CyberWeel was built on a different idea: meaningful progress begins with clarity, depends on a sound decision, and continues through deliberate execution."}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-camel/30 bg-background p-8 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="eyebrow-camel">{ar ? "لماذا نحن موجودون؟" : "Why CyberWeel exists"}</p>
              <h2 className="mt-5 font-display text-3xl font-light leading-tight text-ink sm:text-4xl">
                {ar ? "لأن التنفيذ قبل الفهم يكلّف أكثر مما يبدو" : "Because building before understanding is expensive in ways a budget rarely shows"}
              </h2>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                {ar
                  ? "بدأت CyberWeel من ملاحظة تتكرر كثيرًا: أصحاب أعمال يملكون طموحًا وإمكانات حقيقية، لكنهم يبدأون ببناء موقع أو نظام أو حملة تسويقية قبل أن تتضح المشكلة التي يريدون حلها فعلًا"
                  : "We repeatedly saw capable business owners invest in websites, systems, campaigns, and tools before the underlying business problem had been defined clearly."}
              </p>
              <p>
                {ar
                  ? "والنتيجة تكون وقتًا ومالًا يُصرفان على تنفيذ قد يكون جيدًا، لكنه لا يعالج أصل المشكلة ولا ينقل المشروع إلى المرحلة التالية"
                  : "The work itself could be technically good and still fail to remove the real bottleneck, improve the operation, or move the business into its next stage."}
              </p>
              <p className="font-medium text-ink">
                {ar
                  ? "لهذا وُجدت CyberWeel: لنفهم أولًا، ثم نختار القرار الصحيح، ثم نبني ما يحتاجه المشروع فعلًا"
                  : "That is why CyberWeel exists: understand first, make the right decision, and then build only what the business genuinely needs."}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const [title, text] = step;
            return (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl border border-border bg-background p-8 text-center transition hover:-translate-y-1 hover:border-camel/40 hover:shadow-lg"
            >
              <span className="font-display text-2xl text-accent">{title}</span>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
            </motion.div>
            );
          })}
        </div>
      </Section>

      <Section tone="background">
        <SectionHeading
          align="center"
          eyebrow={ar ? "تطبيق عملي لمنهجيتنا" : "Our methodology in practice"}
          title={ar ? "مشاريع قيد الإنشاء" : "Showing the work while it is still being built"}
          intro={ar ? "نشارك ما نبنيه بصدق، حتى قبل اكتمال المشروع" : "We believe progress should be visible and honest, not presented only after the difficult decisions have been hidden."}
          className="mx-auto"
        />

        <motion.article
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-12 max-w-5xl rounded-2xl border border-camel/30 bg-background p-8 shadow-sm sm:p-10 lg:p-12"
        >
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel/10">
                <Store className="h-6 w-6 text-accent" />
              </div>
              <p className="mt-6 text-sm font-bold text-accent">SelaMaro</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-ink">
                {ar ? "متجر إلكتروني قيد الإنشاء" : "An ecommerce experience in development"}
              </h3>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {ar
                  ? "في مشروع SelaMaro لم نبدأ بالتصميم أو إضافة الخصائص مباشرة. بدأنا بمراجعة تجربة العميل، وتنظيم أقسام المتجر، وفحص رحلة الشراء من صفحة المنتج حتى إتمام الطلب"
                  : "With SelaMaro, we did not begin by adding features or redesigning screens. We first reviewed the customer experience, the store structure, and the complete buying journey from product discovery to checkout."}
              </p>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {ar
                  ? "خلال ذلك ظهرت نقاط تحتاج إلى معالجة، فأُعيد ترتيب الأولويات وأصبح التطوير يسير وفق خطوات أوضح"
                  : "That review exposed the friction that mattered most, allowing the priorities to be reordered before more time and budget were committed to development."}
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {project.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.article>
      </Section>

      <AboutIdentitySection
        isArabic={ar}
        weAreTitle={a.weAreTitle}
        weAre={a.weAre}
        weAreNotTitle={a.weAreNotTitle}
        weAreNot={a.weAreNot}
      />

      <AboutWhoWeHelpSection
        tagline={t.brandTagline}
        eyebrow={a.whoWeHelpEyebrow}
        title={a.whoWeHelpTitle}
        intro={a.whoWeHelpIntro}
        body={a.whoWeHelpBody}
        cta={a.cta}
        onCta={() => navigate("share-challenge")}
      />
    </div>
  );
}
