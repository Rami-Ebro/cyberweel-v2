"use client";

import { ShieldCheck, Clock, MessageCircle, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

export function ShareChallengeView() {
  const { view } = useNav();
  const { t } = useI18n();
  const s = t.shareChallenge;
  const isArabic = t.dir === "rtl";
  const REASSURANCE_ICONS = [MessageCircle, ShieldCheck, Clock];

  return (
    <div>
      <PageHeader
        eyebrow={isArabic ? "للمشاريع والتحديات" : "For projects and challenges"}
        title={
          <>
            {isArabic ? "لديك مشكلة أو قرار" : "Have a challenge or decision"}
            <br />
            <span className="text-accent">
              {isArabic ? "يحتاج إلى صورة أوضح؟" : "that needs a clearer picture?"}
            </span>
          </>
        }
        intro={
          isArabic
            ? "هذه الصفحة للمشاريع والتحديات الرقمية أو التشغيلية التي تحتاج إلى فهم وتحليل وتحديد الخطوة التالية قبل التنفيذ"
            : "Use this page for digital or operational projects and challenges that need diagnosis, clarity, and a well-chosen next step before execution"
        }
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <div className="mb-7 rounded-xl border border-camel/25 bg-camel/5 p-5">
              <p className="text-sm font-semibold text-ink">
                {isArabic ? "هذا النموذج مناسب عندما:" : "Use this form when:"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isArabic
                  ? "لديك مشروع، مشكلة رقمية، قرار تقني أو تشغيلي، أو فكرة تحتاج إلى تقييم قبل أن تبدأ التنفيذ"
                  : "You have a project, digital problem, technical or operational decision, or an idea that needs evaluation before execution"}
              </p>
            </div>

            <h2 className="font-display text-2xl font-medium text-ink">
              {isArabic ? "اشرح لنا وضعك الحالي" : s.formHeading}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {isArabic
                ? "لا تحتاج إلى معرفة الحل. أخبرنا بما يحدث، وما النتيجة التي تريد الوصول إليها"
                : s.formHint}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${isArabic ? "مشروع أو تحدٍ جديد" : s.eyebrow} — CyberWeel`}
                submitLabel={s.submitLabel}
                successMessage={isArabic ? "وصل تحديك بنجاح، وسنراجعه ونتواصل معك قريبًا" : "Your challenge was sent successfully. We will review it and get back to you soon."}
                allowAttachments
                fields={s.fields.map((f) => ({ ...f, kind: f.rows ? "textarea" : "text" }))}
              />
            </div>
          </div>

          <aside className="space-y-6">
            {s.reassurance.map((r, i) => {
              const Icon = REASSURANCE_ICONS[i] ?? MessageCircle;
              return (
                <div key={r.title} className="rounded-xl border border-border bg-muted/50 p-6">
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 font-display text-lg font-medium text-ink">{r.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{r.text}</p>
                </div>
              );
            })}

            <div className="rounded-xl bg-ink p-6 text-floral">
              <p className="font-display text-lg">
                {isArabic ? "لديك استفسار عام أو طلب شراكة؟" : "Have a general enquiry or partnership request?"}
              </p>
              <p className="mt-2 text-base text-bone/75">
                {isArabic ? "استخدم صفحة تواصل بدل هذا النموذج" : "Use the contact page instead of this form"}
              </p>
              <a href={`mailto:${BRAND.email}`} className="focus-ring mt-2 inline-block rounded-md font-medium text-camel hover:underline">
                {BRAND.email}
              </a>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="muted" className="section-texture !pt-0">
        <SectionHeading
          eyebrow={s.commonEyebrow}
          title={s.commonTitle}
          intro={s.commonIntro}
          className="mx-auto max-w-2xl"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {s.commonQuestions.map((cq) => (
            <div key={cq.q} className="rounded-xl border border-border bg-background p-6">
              <HelpCircle className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-display text-base font-medium text-ink">{cq.q}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{cq.a}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
