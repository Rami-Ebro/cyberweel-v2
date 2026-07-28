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
        eyebrow={isArabic ? "للمشاريع والتحديات" : "For projects, problems, and decisions"}
        title={
          <>
            {isArabic ? "لديك مشكلة أو قرار" : "Facing a challenge or decision"}
            <br />
            <span className="text-accent">
              {isArabic ? "يحتاج إلى صورة أوضح؟" : "that needs a clearer direction?"}
            </span>
          </>
        }
        intro={
          isArabic
            ? "هذه الصفحة للمشاريع والتحديات الرقمية أو التشغيلية التي تحتاج إلى فهم وتحليل وتحديد الخطوة التالية قبل التنفيذ"
            : "Use this page when a digital or operational project, problem, or decision needs a clearer diagnosis and a well-chosen next step before execution begins."
        }
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <div className="mb-7 rounded-xl border border-camel/25 bg-camel/5 p-5">
              <p className="text-sm font-semibold text-ink">
                {isArabic ? "هذا النموذج مناسب عندما:" : "This form is the right place when:"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isArabic
                  ? "لديك مشروع، مشكلة رقمية، قرار تقني أو تشغيلي، أو فكرة تحتاج إلى تقييم قبل أن تبدأ التنفيذ"
                  : "You have a project, digital problem, technical or operational decision, or an idea that needs to be evaluated before you commit time and budget."}
              </p>
            </div>

            <h2 className="font-display text-2xl font-medium text-ink">
              {isArabic ? "اشرح لنا وضعك الحالي" : "Tell us what is happening now"}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {isArabic
                ? "صف لنا ما يحدث الآن، وما النتيجة التي تريد الوصول إليها. سنساعدك على توضيح الصورة وتحديد الخطوة التالية."
                : "Describe your current situation, what is getting in the way, and what you hope to achieve. We will help you bring the picture into focus and identify the most useful next step."}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${isArabic ? "مشروع أو تحدٍ جديد" : "New Project or Challenge"} — CyberWeel`}
                submitLabel={isArabic ? s.submitLabel : "Share Your Situation"}
                successMessage={isArabic ? "وصل طلبك بنجاح، وسنراجعه ونتواصل معك قريبًا" : "Your message is ready. We will review it carefully and get back to you soon."}
                allowAttachments
                trackReferral
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
                {isArabic ? "استخدم صفحة تواصل بدل هذا النموذج" : "The contact page is a better fit for general questions, introductions, and partnership enquiries."}
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
          eyebrow={isArabic ? s.commonEyebrow : "Before you write"}
          title={isArabic ? s.commonTitle : "A few useful things to know"}
          intro={isArabic ? s.commonIntro : "You do not need a finished brief or a fully formed plan. These answers cover the questions people usually have before reaching out."}
          className="mx-auto max-w-2xl"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {(isArabic
            ? s.commonQuestions
            : [
                {
                  q: "Do I need a polished brief?",
                  a: "No. Plain language is enough. Tell us what is happening, what feels unclear, and what you are trying to achieve.",
                },
                {
                  q: "What if I am not sure I need a project yet?",
                  a: "That is a perfectly valid starting point. The most useful outcome may be a smaller step, an improvement to what you have, or deciding to wait.",
                },
                {
                  q: "Will this turn into a sales pitch?",
                  a: "No. We may tell you that the work you first imagined is not the right priority. Our role is to help you make a sound decision, not manufacture a project.",
                },
              ]
          ).map((cq) => (
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
