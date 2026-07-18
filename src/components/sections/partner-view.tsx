"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, Check, Handshake, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

const PARTNER_AR = {
  eyebrow: "دعوة لأصحاب الخبرة",
  title: "شاركنا خبرتك ونفّذ معنا مشاريع حقيقية",
  intro: "مبرمجون، مصممون، مسوقون، محللون، وخبراء تنفيذ",
  items: [
    "ساهم في تحويل الأفكار والمشكلات إلى حلول عملية",
    "اعمل ضمن نطاق واضح ومسؤوليات محددة",
    "احصل على فرص مناسبة لتخصصك",
    "ابنِ تعاونًا مستمرًا معنا عند نجاح التجربة",
  ],
  cta: "انضم كشريك تنفيذ",
};

const AMBASSADOR_AR = {
  eyebrow: "مسار السفير",
  title: "كن سفيرًا لـ CyberWeel وحقق أرباحًا",
  intro: "أوصلنا إلى أصحاب الأعمال المناسبين، واحصل على عمولة واضحة عند تحوّل الفرصة إلى مشروع",
  items: [
    "عمولة أو مكافأة متفق عليها",
    "دعم في تقييم الفرص ومتابعتها",
    "مواد تساعدك في تقديم CyberWeel",
    "لوحة تحكم شفافة تحفظ حقوقك وتوضح كل فرصة وعمولتها وحالتها",
  ],
  cta: "انضم كسفير CyberWeel",
};

const PARTNER_EN = {
  eyebrow: "A call for experienced professionals",
  title: "Bring your expertise and build real projects with us",
  intro: "Developers, designers, marketers, analysts, and delivery specialists",
  items: [
    "Turn ideas and problems into practical solutions",
    "Work within a clear scope and defined responsibilities",
    "Receive opportunities suited to your expertise",
    "Build an ongoing collaboration after a successful trial",
  ],
  cta: "Join as a delivery partner",
};

const AMBASSADOR_EN = {
  eyebrow: "Ambassador path",
  title: "Become a CyberWeel ambassador and earn",
  intro: "Connect us with suitable business owners and receive a clear commission when an opportunity becomes a project",
  items: [
    "An agreed commission or reward",
    "Support evaluating and following up opportunities",
    "Materials that help you present CyberWeel",
    "A transparent dashboard that protects your rights and shows every opportunity, commission, and status",
  ],
  cta: "Join as a CyberWeel ambassador",
};

export function PartnerView() {
  const { view } = useNav();
  const { t } = useI18n();
  const p = t.partner;
  const isArabic = t.dir === "rtl";
  const paths = isArabic ? [PARTNER_AR, AMBASSADOR_AR] : [PARTNER_EN, AMBASSADOR_EN];

  const scrollToForm = () => {
    document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <PageHeader
        eyebrow={isArabic ? "مساران للتعاون" : "Two ways to collaborate"}
        title={
          <>
            {isArabic ? "انضم إلى عائلة CyberWeel" : "Join the CyberWeel family"}
            <br />
            <span className="text-accent">
              {isArabic ? "بالطريقة التي تناسبك" : "in the way that fits you"}
            </span>
          </>
        }
        intro={isArabic ? "اختر المسار الأقرب لك وابدأ خطوة واضحة نحو تعاون حقيقي" : "Choose the path that fits you and take a clear first step toward real collaboration"}
        actions={<ShareAction view={view} />}
      />

      <Section tone="muted" className="!pt-0">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          {paths.map((path, index) => {
            const Icon = index === 0 ? BriefcaseBusiness : Megaphone;
            return (
              <motion.article
                key={path.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="flex flex-col rounded-2xl border border-border bg-white p-8 sm:p-10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <p className="mt-6 text-sm font-bold text-accent">{path.eyebrow}</p>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink">{path.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{path.intro}</p>
                <ul className="mt-8 space-y-3">
                  {path.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="focus-ring mt-8 inline-flex w-fit items-center justify-center rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-floral transition hover:-translate-y-0.5 hover:bg-accent"
                >
                  {path.cta}
                </button>
              </motion.article>
            );
          })}
        </div>
      </Section>

      <Section tone="floral">
        <SectionHeading
          align="center"
          eyebrow={isArabic ? "بعد إرسال الطلب" : "After you apply"}
          title={isArabic ? "ماذا يحدث بعد ذلك؟" : "What happens next?"}
          intro={isArabic ? "نراجع الطلب، نتحقق من التوافق، ثم نبدأ بتجربة واضحة ومحدودة قبل أي تعاون طويل" : "We review the request, confirm fit, and begin with a clear limited trial before any long-term collaboration"}
          className="mx-auto"
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            ["01", isArabic ? "مراجعة الطلب" : "Review", isArabic ? "نراجع الخبرة أو طبيعة الشبكة والفرص" : "We review your expertise or network"],
            ["02", isArabic ? "محادثة توافق" : "Fit call", isArabic ? "نوضح التوقعات وطريقة العمل والمقابل" : "We align on expectations and terms"],
            ["03", isArabic ? "تجربة أولى" : "First trial", isArabic ? "نبدأ بمهمة أو فرصة محددة قبل التوسع" : "We start with one defined task or opportunity"],
          ].map(([n, title, text]) => (
            <div key={n} className="rounded-xl border border-border bg-white p-7">
              <span className="text-sm font-semibold text-accent">{n}</span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <div id="partner-form" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Handshake className="h-9 w-9 text-camel" />
            <h2 className="mt-6 font-display text-3xl font-light text-floral">
              {isArabic ? "اختر المسار المناسب وعرّفنا بنفسك" : "Choose your path and introduce yourself"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-bone/70">
              {isArabic ? "أرسل خبرتك أو طبيعة شبكتك، وما الذي تتوقعه من التعاون. يمكنك إرفاق السيرة أو ملف الأعمال" : "Tell us about your expertise or network and what you expect from the collaboration. You may attach a CV or portfolio"}
            </p>
          </div>
          <div className="rounded-2xl border border-bone/15 bg-background p-8 sm:p-10">
            <MailtoForm
              to={BRAND.email}
              subject={`${isArabic ? "طلب شراكة أو سفير" : p.eyebrow} — CyberWeel`}
              submitLabel={p.submitLabel}
              successMessage={isArabic ? "وصل طلبك بنجاح، وسنراجعه ونتواصل معك عند وجود توافق" : "Your request was sent successfully. We will review it and contact you if there is a fit."}
              allowAttachments
              fields={p.fields.map((f) => ({ ...f, kind: f.rows ? "textarea" : "text" }))}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
