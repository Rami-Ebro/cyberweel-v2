"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

const SERVICES_AR = [
  {
    title: "المواقع والمنصات الرقمية",
    text: "نصمّم ونطوّر مواقع الشركات، المتاجر الإلكترونية، ومنصات الخدمات الرقمية بما يوضّح قيمة عملك ويسهّل وصول العملاء إليك",
    result: "النتيجة: حضور رقمي احترافي يساعدك على جذب العملاء وتحويل الزيارات إلى خطوات فعلية",
  },
  {
    title: "أنظمة إدارة الأعمال",
    text: "نبني أنظمة مخصّصة لإدارة العمليات، العملاء، المبيعات، المخزون، والمهام بما يتناسب مع طريقة عمل شركتك",
    result: "النتيجة: عمليات أكثر تنظيمًا، أخطاء أقل، ورؤية أوضح لما يحدث داخل العمل",
  },
  {
    title: "الأتمتة والذكاء الاصطناعي",
    text: "نربط الأدوات والأنظمة، ونؤتمت المهام المتكررة، ونوظّف الذكاء الاصطناعي في الأماكن التي يحقق فيها فائدة عملية حقيقية",
    result: "النتيجة: وقت أقل في الأعمال الروتينية، سرعة أكبر في التنفيذ، وقدرة أفضل على التوسع",
  },
  {
    title: "الأمن السيبراني وحماية الأعمال الرقمية",
    text: "نقيّم المخاطر الرقمية، ونساعدك على حماية المواقع والأنظمة والحسابات والبيانات، ووضع إجراءات تقلّل احتمالات الاختراق أو فقدان المعلومات",
    result: "النتيجة: بيئة رقمية أكثر أمانًا، واستمرارية أفضل للعمل، وثقة أكبر لدى العملاء والشركاء",
  },
] as const;

const SERVICES_EN = [
  {
    title: "Websites and digital platforms",
    text: "We design and build company websites, online stores, and digital service platforms that communicate value clearly and make it easier for customers to act",
    result: "Result: a professional digital presence that helps attract customers and turn visits into action",
  },
  {
    title: "Business management systems",
    text: "We build tailored systems for operations, customers, sales, inventory, and tasks around how your business actually works",
    result: "Result: better-organized operations, fewer errors, and clearer visibility across the business",
  },
  {
    title: "Automation and AI",
    text: "We connect tools, automate repetitive work, and apply AI where it creates practical value rather than noise",
    result: "Result: less routine work, faster execution, and stronger ability to scale",
  },
  {
    title: "Cybersecurity and digital protection",
    text: "We assess digital risks and help protect sites, systems, accounts, and business data with practical safeguards suited to your scale",
    result: "Result: stronger digital protection, better continuity, and greater trust from customers and partners",
  },
] as const;

const DELIVERY_AR = [
  ["التقييم", "نفهم الوضع الحالي، ونراجع الاحتياج والمخاطر وما يستحق الأولوية"],
  ["التخطيط", "نحدّد الحل المناسب، ونحوّله إلى نطاق واضح وخطوات قابلة للتنفيذ"],
  ["التنفيذ", "نبني الحل أو نطوّر الموجود بمسؤوليات واضحة ونتائج يمكن متابعتها"],
  ["التطوير", "نقيس الأداء، نعالج نقاط الضعف، ونطوّر الحل بما يخدم المرحلة التالية"],
] as const;

const DELIVERY_EN = [
  ["Assessment", "We understand the current state, the need, the risks, and the real priority"],
  ["Planning", "We define the right solution and turn it into a clear, executable scope"],
  ["Execution", "We build or improve the solution with clear ownership and trackable outcomes"],
  ["Development", "We measure performance, address weaknesses, and improve the solution for the next stage"],
] as const;

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;
  const isArabic = t.dir === "rtl";
  const services = isArabic ? SERVICES_AR : SERVICES_EN;
  const delivery = isArabic ? DELIVERY_AR : DELIVERY_EN;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={<>{h.titleLine1}<br /><span className="text-accent">{h.titleLine2}</span></>}
        intro={isArabic ? "نفهم المشكلة أولًا، ثم نحدّد وننفّذ ما يحتاجه مشروعك فعلًا: موقع، متجر، نظام، أتمتة، أمن سيبراني، أو تطوير لما لديك" : "We understand the problem first, then define and execute what your business truly needs: a site, store, system, automation, cybersecurity, or improvement to what you already have"}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <SectionHeading
          align="center"
          eyebrow={isArabic ? "كيف نعمل" : "How we work"}
          title={isArabic ? "إيقاع هادئ ومدروس" : "A calm, deliberate rhythm"}
          intro={isArabic ? "نبدأ بالفهم، ولا نتحرّك قبل أن تصبح الخطوة التالية واضحة" : "We begin with understanding and do not move until the next step is clear"}
          className="mx-auto"
        />
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
          {h.process.map((p, index) => (
            <motion.article key={p.n} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.06 }} className="group rounded-xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{p.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.text}</p>
              <div className="mt-5 border-t border-border/70 pt-4"><span className="block h-px w-10 bg-accent/50 transition-all duration-300 group-hover:w-16" aria-hidden /></div>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          align="center"
          eyebrow={isArabic ? "ماذا ننفّذ" : "What we deliver"}
          title={isArabic ? "حلول رقمية وتنفيذية واضحة" : "Clear digital solutions and execution"}
          intro={isArabic ? "لا نتوقف عند تقديم الأفكار أو التوصيات. نقيّم احتياج عملك، نحدّد الحل المناسب، ثم نخطط له وننفّذه ونطوّره معك" : "We do not stop at ideas or recommendations. We assess the need, define the right solution, plan it, build it, and improve it with you"}
          className="mx-auto"
        />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2">
          {services.map((service, index) => (
            <motion.article key={service.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.05 }} className="group rounded-xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{service.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{service.text}</p>
              <p className="mt-5 border-t border-border/70 pt-4 text-sm font-semibold leading-relaxed text-ink/75">{service.result}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="background">
        <SectionHeading
          align="center"
          eyebrow={isArabic ? "من التقييم إلى التطوير" : "From assessment to improvement"}
          title={isArabic ? "من الفكرة إلى نتيجة قابلة للقياس" : "From an idea to a measurable outcome"}
          intro={isArabic ? "قد تحتاج إلى بناء حل جديد، أو تحسين ما لديك، أو اكتشاف أن المشكلة ليست تقنية من الأساس. مهمتنا هي تحديد القرار الصحيح ثم تنفيذه بطريقة تخدم تقدّمك" : "You may need a new solution, an improvement to what you have, or the realization that the problem is not technical at all. Our role is to identify the right decision and execute it in a way that supports progress"}
          className="mx-auto"
        />
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {delivery.map(([title, text], index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="rounded-xl border border-camel/25 bg-background p-7 text-center shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-bone/60">{h.honestyEyebrow}</p>
          <h2 className="mt-6 font-display text-3xl font-normal leading-relaxed text-floral">{h.honestyStatement}</h2>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-bone/75">
            {h.honestyBody.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <PrimaryCta onClick={() => navigate("share-challenge")}>{isArabic ? "شاركنا مشكلتك" : h.honestyCta}</PrimaryCta>
            <button type="button" onClick={() => navigate("about")} className="focus-ring inline-flex items-center gap-2 text-base font-medium text-bone/80 hover:text-floral">
              {h.honestySecondary}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
