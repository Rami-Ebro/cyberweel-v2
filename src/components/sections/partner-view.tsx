"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, Check, Handshake, Megaphone, Route } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

const PARTNER_AR = {
  title: "شريك تنفيذ وخبرة",
  intro: "للمبرمجين والمصممين والمسوقين والمحللين والخبراء الذين يمكنهم المشاركة في تنفيذ مشاريع حقيقية",
  gives: ["خبرة قابلة للتطبيق", "التزام واضح بالمواعيد والجودة", "تعاون مهني وشفاف"],
  gets: ["فرص عمل مناسبة لتخصصك", "نطاق ومسؤوليات واضحة", "تعاون طويل المدى عند نجاح التجربة"],
};

const AMBASSADOR_AR = {
  title: "سفير CyberWeel",
  intro: "لمن يملك شبكة علاقات جيدة، يفهم احتياجات أصحاب الأعمال، ويستطيع الوصول إلى فرص مناسبة",
  gives: ["ترشيح فرص جادة ومناسبة", "تمثيل صادق للعلامة", "مساعدة أولية في فهم حاجة العميل"],
  gets: ["مكافأة أو عمولة متفق عليها", "مواد وأدوات تساعدك في التعريف بنا", "دعم مباشر في تقييم الفرص"],
};

const PARTNER_EN = {
  title: "Execution and expertise partner",
  intro: "For developers, designers, marketers, analysts, and specialists who can contribute to real client work",
  gives: ["Practical expertise", "Clear commitment to quality and deadlines", "Professional and transparent collaboration"],
  gets: ["Relevant project opportunities", "Clear scope and responsibilities", "Long-term collaboration when the fit is proven"],
};

const AMBASSADOR_EN = {
  title: "CyberWeel ambassador",
  intro: "For people with strong networks who understand business needs and can surface suitable opportunities",
  gives: ["Serious and relevant referrals", "Honest brand representation", "Initial help understanding the client need"],
  gets: ["Agreed reward or commission", "Materials to help present CyberWeel", "Direct support evaluating opportunities"],
};

export function PartnerView() {
  const { view } = useNav();
  const { t } = useI18n();
  const p = t.partner;
  const isArabic = t.dir === "rtl";
  const paths = isArabic ? [PARTNER_AR, AMBASSADOR_AR] : [PARTNER_EN, AMBASSADOR_EN];

  return (
    <div>
      <PageHeader
        eyebrow={isArabic ? "مساران للتعاون" : "Two ways to collaborate"}
        title={
          <>
            {isArabic ? "انضم إلى CyberWeel" : "Join CyberWeel"}
            <br />
            <span className="text-accent">
              {isArabic ? "بالطريقة التي تناسبك" : "in the way that fits you"}
            </span>
          </>
        }
        intro={isArabic ? "يمكنك أن تعمل معنا في التنفيذ، أو تمثل CyberWeel وتصل بنا إلى فرص مناسبة" : "You can contribute to delivery, or represent CyberWeel and connect us with suitable opportunities"}
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
                className="rounded-2xl border border-border bg-white p-8 sm:p-10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h2 className="mt-6 font-display text-3xl font-semibold text-ink">{path.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{path.intro}</p>

                <div className="mt-8 grid gap-7 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-bold text-ink">{isArabic ? "ما الذي تقدّمه" : "What you bring"}</h3>
                    <ul className="mt-4 space-y-3">
                      {path.gives.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{isArabic ? "ما الذي تحصل عليه" : "What you receive"}</h3>
                    <ul className="mt-4 space-y-3">
                      {path.gets.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
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
