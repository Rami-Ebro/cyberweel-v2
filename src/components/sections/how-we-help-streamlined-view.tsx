"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

const PROCESS_AR = [
  { title: "إصغاء", text: "نبدأ بفهم أين أنت اليوم، وسياق عملك، وما تحاول حلّه فعلًا" },
  { title: "إيضاح", text: "نفصل الإشارة عن الضجيج، ونحدّد أصل المشكلة وما يستحق الأولوية" },
  { title: "قرار", text: "نقارن الخيارات الواقعية ونختار المسار الأنسب لواقع مشروعك" },
  { title: "تحرّك", text: "نحوّل القرار إلى خطوات واضحة، ثم ننفّذ ونقيس التقدّم" },
] as const;

const PROCESS_EN = [
  { title: "Listen", text: "We begin by understanding where you are, your context, and what you are truly trying to solve" },
  { title: "Clarify", text: "We separate signal from noise and identify the real problem and priority" },
  { title: "Decide", text: "We compare realistic options and choose the path that fits your business" },
  { title: "Move", text: "We turn the decision into clear steps, execute, and measure progress" },
] as const;

const SERVICES_AR = [
  { title: "المواقع والمتاجر والمنصات", text: "نصمّم ونطوّر مواقع الشركات، المتاجر الإلكترونية، المنصات الرقمية، وصفحات الهبوط حول هدف واضح يخدم مشروعك", result: "النتيجة: حضور رقمي احترافي يساعد الزائر على فهم قيمتك واتخاذ خطوة فعلية" },
  { title: "أنظمة SaaS والأنظمة المخصصة", text: "نبني أنظمة قابلة للنمو، لوحات إدارة، بوابات عملاء، وحلولًا مخصّصة تتوافق مع طريقة عمل مشروعك", result: "النتيجة: عمليات أكثر تنظيمًا، ورؤية أوضح، ونظام ينمو مع احتياجك" },
  { title: "تطبيقات الموبايل", text: "نطوّر تطبيقات عملية للهواتف تربط خدمتك بالمستخدم وتبسّط الوصول والاستخدام والمتابعة", result: "النتيجة: تجربة أسهل للمستخدم وقناة رقمية أقرب إلى العميل" },
  { title: "التحليل المالي ودعم القرار", text: "نقرأ الربحية والتكاليف والتدفقات والبيانات المالية، ونحوّل الأرقام إلى مؤشرات وقرارات قابلة للتنفيذ", result: "النتيجة: قرارات مالية أوضح، واكتشاف مبكر للهدر والفرص والمخاطر" },
  { title: "أتمتة العمليات والذكاء الاصطناعي", text: "نربط الأدوات والأنظمة، ونؤتمت المهام المتكررة، ونوظّف الذكاء الاصطناعي حيث يحقق فائدة عملية حقيقية", result: "النتيجة: وقت أقل في العمل الروتيني، أخطاء أقل، وسرعة أكبر في التنفيذ" },
  { title: "رموز QR الديناميكية والروابط الذكية", text: "نبني روابط ورموز QR قابلة للإدارة وتغيير الوجهة والتتبّع دون الحاجة إلى إعادة الطباعة", result: "النتيجة: حملات ومواد مطبوعة أكثر مرونة مع بيانات أوضح عن التفاعل" },
  { title: "الهوية والتموضع ومسارات التحويل", text: "نوضّح هوية العلامة ورسائلها، ونبني الصفحات والحملات والمسارات التي تساعد العميل على فهم القيمة والتحرّك", result: "النتيجة: علامة أوضح، رسالة أقوى، وتجربة تقود الزائر نحو القرار المناسب" },
  { title: "الأمن السيبراني وحماية الأعمال الرقمية", text: "نقيّم المخاطر ونقاط الضعف، ونساعدك على حماية المواقع والأنظمة والحسابات والبيانات بإجراءات عملية تناسب حجم مشروعك", result: "النتيجة: بيئة رقمية أكثر أمانًا، واستمرارية أفضل للعمل، وثقة أكبر لدى العملاء والشركاء" },
] as const;

const SERVICES_EN = [
  { title: "Websites, stores, and platforms", text: "We design and build business websites, ecommerce stores, digital platforms, and landing pages around a clear business outcome", result: "Result: a professional digital presence that helps visitors understand your value and take action" },
  { title: "SaaS and custom systems", text: "We build scalable systems, admin dashboards, client portals, and tailored solutions around how your business works", result: "Result: better-organized operations, clearer visibility, and systems that grow with your needs" },
  { title: "Mobile applications", text: "We develop practical mobile applications that connect your service with users and simplify access, use, and follow-up", result: "Result: an easier user experience and a digital channel closer to the customer" },
  { title: "Financial analysis and decision support", text: "We analyze profitability, costs, cash flow, and financial data and turn numbers into practical decision signals", result: "Result: clearer financial decisions and earlier visibility into waste, opportunities, and risks" },
  { title: "Process automation and AI", text: "We connect tools and systems, automate repetitive tasks, and apply AI where it creates genuine practical value", result: "Result: less routine work, fewer errors, and faster execution" },
  { title: "Dynamic QR codes and smart links", text: "We build manageable and trackable links and QR codes whose destination can change without reprinting", result: "Result: more flexible campaigns and print materials with clearer engagement data" },
  { title: "Identity, positioning, and conversion journeys", text: "We clarify brand identity and messaging and build pages, campaigns, and journeys that help customers understand value and move forward", result: "Result: a clearer brand, stronger messaging, and a journey that guides visitors toward the right decision" },
  { title: "Cybersecurity and digital protection", text: "We assess risks and weaknesses and help protect sites, systems, accounts, and business data with practical safeguards suited to your scale", result: "Result: stronger digital protection, better continuity, and greater trust from customers and partners" },
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

const CARD_HOVER = "transition-all duration-300 hover:-translate-y-1 hover:bg-camel hover:shadow-lg";

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;
  const isArabic = t.dir === "rtl";
  const process = isArabic ? PROCESS_AR : PROCESS_EN;
  const services = isArabic ? SERVICES_AR : SERVICES_EN;
  const delivery = isArabic ? DELIVERY_AR : DELIVERY_EN;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={<><span className="block">{h.titleLine1}</span><span className="mt-5 block text-accent sm:mt-6">{h.titleLine2}</span></>}
        intro={isArabic ? "نفهم المشكلة أولًا، ثم نحدّد وننفّذ ما يحتاجه مشروعك فعلًا: موقع، منصة، نظام، أتمتة، أمن سيبراني، أو تطوير لما لديك" : "We understand the problem first, then define and execute what your business truly needs: a site, platform, system, automation, cybersecurity, or improvement to what you already have"}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-20 sm:!pt-24">
        <SectionHeading align="center" eyebrow={isArabic ? "كيف نعمل" : "How we work"} title={isArabic ? "إيقاع هادئ ومدروس" : "A calm, deliberate rhythm"} intro={isArabic ? "نبدأ بالفهم، ولا نتحرّك قبل أن تصبح الخطوة التالية واضحة" : "We begin with understanding and do not move until the next step is clear"} className="mx-auto" />
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
          {process.map((item, index) => (
            <motion.article key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.06 }} className={`${CARD_HOVER} rounded-xl border border-border bg-white p-7`}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{item.text}</p>
              <div className="mt-5 border-t border-border/70 pt-4"><span className="block h-px w-10 bg-accent/50 transition-all duration-300 hover:w-16" aria-hidden /></div>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="muted" className="!pt-28 sm:!pt-32">
        <SectionHeading align="center" eyebrow={isArabic ? "ماذا ننفّذ" : "What we deliver"} title={isArabic ? "حلول رقمية وتنفيذية واضحة" : "Clear digital solutions and execution"} intro={isArabic ? "لا نتوقف عند تقديم الأفكار أو التوصيات. نقيّم احتياج عملك، نحدّد الحل المناسب، ثم نخطط له وننفّذه ونطوّره معك" : "We do not stop at ideas or recommendations. We assess the need, define the right solution, plan it, build it, and improve it with you"} className="mx-auto" />
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.article key={service.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.05 }} className={`${CARD_HOVER} rounded-xl border border-border bg-white p-8`}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold leading-snug text-ink">{service.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{service.text}</p>
              <p className="mt-6 border-t border-border/70 pt-5 text-sm font-semibold leading-relaxed text-ink/75">{service.result}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="background">
        <SectionHeading align="center" eyebrow={isArabic ? "من التقييم إلى التطوير" : "From assessment to improvement"} title={isArabic ? "من الفكرة إلى نتيجة قابلة للقياس" : "From an idea to a measurable outcome"} intro={isArabic ? "قد تحتاج إلى بناء حل جديد، أو تحسين ما لديك، أو اكتشاف أن المشكلة ليست تقنية من الأساس. مهمتنا ليست بيعك أكبر مشروع، بل مساعدتك على اتخاذ القرار الصحيح وتنفيذه بطريقة تخدم تقدّمك" : "You may need a new solution, an improvement to what you have, or the realization that the problem is not technical at all. Our role is not to sell the largest project, but to identify and execute the right decision for your progress"} className="mx-auto" />
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {delivery.map(([title, text], index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.06 }} className={`${CARD_HOVER} rounded-xl border border-camel/25 bg-white p-7 text-center shadow-sm`}>
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
          <div className="mt-8 space-y-4 text-base leading-relaxed text-bone/75">{h.honestyBody.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <PrimaryCta onClick={() => navigate("share-challenge")}>{isArabic ? "شاركنا مشكلتك" : h.honestyCta}</PrimaryCta>
            <button type="button" onClick={() => navigate("about")} className="focus-ring inline-flex items-center gap-2 text-base font-medium text-bone/80 hover:text-floral">{h.honestySecondary}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button>
          </div>
        </div>
      </Section>
    </div>
  );
}
