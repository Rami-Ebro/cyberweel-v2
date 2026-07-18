"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

const SERVICES_AR = [
  ["المواقع والمتاجر والمنصات", "مواقع تعريفية، متاجر إلكترونية، منصات رقمية، وصفحات هبوط مصممة لتحقيق هدف واضح"],
  ["أنظمة SaaS والأنظمة المخصصة", "أنظمة قابلة للنمو، لوحات إدارة، بوابات عملاء، وحلول مخصصة لطريقة عمل مشروعك"],
  ["تطبيقات الموبايل", "تطبيقات عملية للهواتف تربط الخدمة بالمستخدم وتبسط الوصول والاستخدام"],
  ["التحليل المالي ودعم القرار", "قراءة الأرقام، تحليل الربحية والتكاليف والتدفقات، وتحويل البيانات إلى قرارات أوضح"],
  ["أتمتة العمليات وربط الأدوات", "تقليل العمل اليدوي، ربط الأنظمة، تنظيم تدفق المعلومات، وبناء عمليات أسرع وأدق"],
  ["رموز QR ديناميكية", "رموز قابلة لتغيير الوجهة والإدارة والتتبع دون إعادة الطباعة"],
  ["الهوية والتموضع ومسارات التحويل", "هوية بصرية، رسائل العلامة، صفحات وحملات ومسارات تساعد الزائر على فهم القيمة واتخاذ الخطوة التالية"],
] as const;

const SERVICES_EN = [
  ["Websites, stores, and platforms", "Business websites, ecommerce stores, digital platforms, and landing pages built around a clear outcome"],
  ["SaaS and custom systems", "Scalable systems, admin dashboards, client portals, and solutions tailored to how your business works"],
  ["Mobile applications", "Practical mobile apps that connect your service with users and simplify access and use"],
  ["Financial analysis and decision support", "Profitability, cost, and cash-flow analysis that turns numbers into clearer decisions"],
  ["Process automation and integrations", "Reduce manual work, connect tools, organize information flow, and build faster, more accurate operations"],
  ["Dynamic QR codes", "Manageable and trackable QR codes whose destination can change without reprinting"],
  ["Identity, positioning, and conversion journeys", "Visual identity, brand messaging, landing pages, campaigns, and journeys that clarify value and move visitors forward"],
] as const;

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;
  const isArabic = t.dir === "rtl";
  const services = isArabic ? SERVICES_AR : SERVICES_EN;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={<>{h.titleLine1}<br /><span className="text-accent">{h.titleLine2}</span></>}
        intro={h.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <SectionHeading align="center" eyebrow={h.processEyebrow} title={h.processTitle} intro={h.processIntro} className="mx-auto" />
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
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{p.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.text}</p>
              <div className="mt-5 border-t border-border/70 pt-4">
                <span className="block h-px w-10 bg-accent/50 transition-all duration-300 group-hover:w-16" aria-hidden />
              </div>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          align="center"
          eyebrow={isArabic ? "بعض ما نقدّمه" : "Some of what we deliver"}
          title={isArabic ? "حلول رقمية وتنفيذية واضحة" : "Clear digital and execution services"}
          intro={isArabic ? "نبدأ بفهم المشكلة والقرار الصحيح، ثم ننفّذ ما يحتاجه مشروعك فعلًا" : "We begin with the problem and the right decision, then build what your business truly needs"}
          className="mx-auto"
        />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(([title, text], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
              className="group rounded-xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
            </motion.article>
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-6xl rounded-xl border border-camel/30 bg-camel/5 px-6 py-5 text-center">
          <p className="font-display text-xl font-medium leading-relaxed text-ink sm:text-2xl">
            {isArabic ? "وأي شيء تقني يمكن أن يساهم في حل مشكلة التقدّم والنمو لديك" : "And anything technical that can help solve your progress and growth challenge"}
          </p>
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
            <PrimaryCta onClick={() => navigate("share-challenge")}>{h.honestyCta}</PrimaryCta>
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
