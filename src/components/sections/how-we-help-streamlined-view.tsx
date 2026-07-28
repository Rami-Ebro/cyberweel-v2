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
  { title: "Listen", text: "We begin by understanding where you are today, how your business works, and what you are genuinely trying to solve." },
  { title: "Clarify", text: "We separate the signal from the noise, identify the underlying issue, and define what deserves attention first." },
  { title: "Decide", text: "We compare realistic options and choose the path that best fits your priorities, resources, and stage of growth." },
  { title: "Execute", text: "We turn the decision into clear steps, deliver the work, and measure whether it is creating meaningful progress." },
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
  { title: "Websites, stores, and digital platforms", text: "We design and build business websites, ecommerce stores, service platforms, and landing pages around a clear commercial objective.", result: "Result: a professional digital presence that communicates your value clearly and helps visitors take the next step." },
  { title: "SaaS products and custom systems", text: "We build scalable software, administration dashboards, client portals, and tailored systems around the way your business actually operates.", result: "Result: more organized operations, better visibility, and a system that can grow with your needs." },
  { title: "Mobile applications", text: "We develop focused mobile applications that make your service easier to access, use, and manage for both customers and teams.", result: "Result: a smoother user experience and a direct digital channel between your business and its customers." },
  { title: "Financial analysis and decision support", text: "We examine profitability, costs, cash flow, and operating data, then translate the numbers into practical business decisions.", result: "Result: clearer financial choices and earlier visibility into waste, opportunity, and risk." },
  { title: "Process automation and AI", text: "We connect tools and systems, automate repetitive work, and apply AI where it produces a useful and measurable operational benefit.", result: "Result: less routine work, fewer avoidable errors, and faster execution." },
  { title: "Dynamic QR codes and smart links", text: "We build manageable, trackable links and QR codes whose destination can be updated without replacing or reprinting the code.", result: "Result: more flexible campaigns and printed materials, supported by clearer engagement data." },
  { title: "Brand positioning and conversion journeys", text: "We clarify brand positioning and messaging, then shape the pages, campaigns, and customer journeys that turn that clarity into action.", result: "Result: a clearer brand, stronger communication, and a journey that guides visitors toward the right decision." },
  { title: "Cybersecurity and digital protection", text: "We assess digital risks and weaknesses, then help protect your websites, systems, accounts, and business data with safeguards suited to your scale.", result: "Result: stronger protection, better business continuity, and greater confidence among customers and partners." },
] as const;

const DELIVERY_AR = [
  ["التقييم", "نفهم الوضع الحالي، ونراجع الاحتياج والمخاطر وما يستحق الأولوية"],
  ["التخطيط", "نحدّد الحل المناسب، ونحوّله إلى نطاق واضح وخطوات قابلة للتنفيذ"],
  ["التنفيذ", "نبني الحل أو نطوّر الموجود بمسؤوليات واضحة ونتائج يمكن متابعتها"],
  ["التطوير", "نقيس الأداء، نعالج نقاط الضعف، ونطوّر الحل بما يخدم المرحلة التالية"],
] as const;

const DELIVERY_EN = [
  ["Assessment", "We understand the current situation, the underlying need, the risks, and what deserves priority."],
  ["Planning", "We define the right solution and turn it into a clear scope, realistic sequence, and executable plan."],
  ["Delivery", "We build the solution or improve what already exists, with clear responsibilities and trackable outcomes."],
  ["Improvement", "We review performance, address weaknesses, and develop the solution for the next stage of the business."],
] as const;

const PROJECT_STEPS_AR = ["تنظيم أقسام المتجر", "تحسين تجربة التصفح", "تبسيط رحلة الشراء", "معالجة نقاط الاحتكاك"] as const;
const PROJECT_STEPS_EN = ["Store structure", "Browsing experience", "Checkout journey", "Friction reduction"] as const;

const CARD_HOVER = "group transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg";
const NUMBER_HOVER = "transition-colors duration-300 group-hover:bg-camel";

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;
  const isArabic = t.dir === "rtl";
  const process = isArabic ? PROCESS_AR : PROCESS_EN;
  const services = isArabic ? SERVICES_AR : SERVICES_EN;
  const delivery = isArabic ? DELIVERY_AR : DELIVERY_EN;
  const projectSteps = isArabic ? PROJECT_STEPS_AR : PROJECT_STEPS_EN;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={<><span className="block">{h.titleLine1}</span><span className="mt-5 block text-accent sm:mt-6">{h.titleLine2}</span></>}
        intro={isArabic ? "نفهم المشكلة أولًا، ثم نحدّد وننفّذ ما يحتاجه مشروعك فعلًا: موقع، منصة، نظام، أتمتة، أمن سيبراني، أو تطوير لما لديك" : "We begin by understanding the problem, then define and deliver what your business genuinely needs: a website, platform, system, automation, cybersecurity support, or a better version of what you already have."}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-20 sm:!pt-24">
        <SectionHeading align="center" eyebrow={isArabic ? "كيف نعمل" : "How we work"} title={isArabic ? "إيقاع هادئ ومدروس" : "A calm, deliberate way of working"} intro={isArabic ? "نبدأ بالفهم، ولا نتحرّك قبل أن تصبح الخطوة التالية واضحة" : "We begin with understanding and do not rush into execution until the next step is clear."} className="mx-auto" />
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
          {process.map((item, index) => (
            <motion.article key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.06 }} className={`${CARD_HOVER} rounded-xl border border-border bg-white p-7`}>
              <span className={`${NUMBER_HOVER} inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-ink`}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{item.text}</p>
              <div className="mt-5 border-t border-border/70 pt-4"><span className="block h-px w-10 bg-accent/50 transition-all duration-300 group-hover:w-16" aria-hidden /></div>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="muted" className="!pt-28 sm:!pt-32">
        <SectionHeading align="center" eyebrow={isArabic ? "ماذا ننفّذ" : "What we deliver"} title={isArabic ? "حلول رقمية وتنفيذية واضحة" : "Clear digital solutions, delivered properly"} intro={isArabic ? "لا نتوقف عند تقديم الأفكار أو التوصيات. نقيّم احتياج عملك، نحدّد الحل المناسب، ثم نخطط له وننفّذه ونطوّره معك" : "We do more than recommend. We assess the need, define the right solution, plan the work, deliver it, and improve it with you."} className="mx-auto" />
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.article key={service.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.05 }} className={`${CARD_HOVER} rounded-xl border border-border bg-white p-8`}>
              <span className={`${NUMBER_HOVER} inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-ink`}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold leading-snug text-ink">{service.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{service.text}</p>
              <p className="mt-6 border-t border-border/70 pt-5 text-sm font-semibold leading-relaxed text-ink/75">{service.result}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="floral">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl rounded-2xl border border-camel/25 bg-white p-8 shadow-sm sm:p-10"
        >
          <p className="eyebrow text-accent">{isArabic ? "من أعمالنا" : "A project in progress"}</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-snug text-ink sm:text-4xl">
                {isArabic ? "SelaMaro — متجر إلكتروني عربي قيد الإنشاء" : "SelaMaro — an Arabic ecommerce experience in development"}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {isArabic
                  ? "نعمل على تطوير تجربة متجر SelaMaro وإعادة تنظيم بنيته، بدءًا من تصفح المنتجات وحتى إتمام الطلب، بهدف جعل رحلة العميل أوضح وأسهل وأكثر استعدادًا للتطوير والتسويق لاحقًا"
                  : "We are restructuring the SelaMaro store experience from product discovery through checkout, creating a clearer and easier customer journey that is ready for future growth and marketing."}
              </p>
            </div>
            <div className="rounded-xl bg-floral p-6">
              <p className="text-sm font-semibold text-ink">{isArabic ? "ما نعمل عليه" : "Current focus"}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-ink/75">
                {projectSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <span>{step}</span>
                    {index < projectSteps.length - 1 && <ArrowRight className="h-4 w-4 text-accent rtl:rotate-180" aria-hidden />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("about")}
            className="focus-ring mt-8 inline-flex items-center gap-2 text-base font-semibold text-ink transition-colors hover:text-accent"
          >
            {isArabic ? "اطّلع على المشروع" : "Explore the project"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </motion.article>
      </Section>

      <Section tone="background">
        <SectionHeading align="center" eyebrow={isArabic ? "من التقييم إلى التطوير" : "From assessment to improvement"} title={isArabic ? "من الفكرة إلى نتيجة قابلة للقياس" : "From an idea to a measurable result"} intro={isArabic ? "قد تحتاج إلى بناء حل جديد، أو تحسين ما لديك، أو اكتشاف أن المشكلة ليست تقنية من الأساس. مهمتنا ليست بيعك أكبر مشروع، بل مساعدتك على اتخاذ القرار الصحيح وتنفيذه بطريقة تخدم تقدّمك" : "You may need a new solution, an improvement to what already exists, or the realization that the problem is not technical at all. Our role is not to sell the largest project. It is to help you choose and deliver the step that genuinely moves the business forward."} className="mx-auto" />
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {delivery.map((step, index) => {
            const [title, text] = step;
            return (
            <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay: index * 0.06 }} className={`${CARD_HOVER} rounded-xl border border-camel/25 bg-white p-7 text-center shadow-sm`}>
              <span className={`${NUMBER_HOVER} inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-ink`}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
            </motion.article>
            );
          })}
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
