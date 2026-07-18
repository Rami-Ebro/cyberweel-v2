"use client";

import { Mail, Clock, Globe } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PageHeader } from "@/components/site/page-header";
import { Section } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { SocialLinks } from "@/components/site/social-links";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

export function ContactView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const c = t.contact;
  const isArabic = t.dir === "rtl";
  const DETAIL_ICONS = [Mail, Clock, Globe];

  return (
    <div>
      <PageHeader
        eyebrow={isArabic ? "للاستفسارات والرسائل العامة" : "For general enquiries"}
        title={
          <>
            {isArabic ? "تواصل معنا" : "Contact CyberWeel"}
            <br />
            <span className="text-accent">
              {isArabic ? "لأي أمر خارج نطاق المشاريع" : "for everything beyond project intake"}
            </span>
          </>
        }
        intro={
          isArabic
            ? "هذه الصفحة للاستفسارات العامة، طلبات الشراكة، التواصل الإعلامي، والرسائل الأخرى التي لا تحتاج إلى تحليل مشروع أو تحدٍ"
            : "Use this page for general enquiries, partnership requests, media contact, and messages that do not require project or challenge analysis"
        }
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <div className="mb-7 rounded-xl border border-camel/25 bg-camel/5 p-5">
              <p className="text-sm font-semibold text-ink">
                {isArabic ? "هذا النموذج مناسب لـ:" : "Use this form for:"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {isArabic
                  ? "الاستفسارات العامة، عروض الشراكة، التواصل الإعلامي، الموردين، والرسائل غير المرتبطة بمشروع يحتاج إلى تحليل"
                  : "General questions, partnership proposals, media contact, suppliers, and messages unrelated to a project that needs analysis"}
              </p>
            </div>

            <h2 className="font-display text-2xl font-medium text-ink">
              {isArabic ? "أرسل رسالتك" : c.formHeading}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {isArabic ? "سنوجّه رسالتك إلى الشخص المناسب ونتواصل معك قريبًا" : c.formHint}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${isArabic ? "رسالة عامة" : c.eyebrow} — CyberWeel`}
                submitLabel={c.submitLabel}
                successMessage={isArabic ? "وصلت رسالتك بنجاح، وسنتواصل معك قريبًا" : "Your message was sent successfully. We will get back to you soon."}
                allowAttachments
                fields={c.fields.map((f) => ({ ...f, kind: f.rows ? "textarea" : "text" }))}
              />
            </div>
          </div>

          <aside className="space-y-5">
            {c.details.map((d, i) => {
              const Icon = DETAIL_ICONS[i] ?? Mail;
              return (
                <div
                  key={d.title}
                  className="group rounded-xl border border-border bg-muted/50 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-camel/40 hover:bg-background hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-camel/10 transition-colors duration-300 group-hover:bg-camel/20">
                    <Icon className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-medium text-ink">{d.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{d.text}</p>
                  {d.href && d.value && (
                    <a href={d.href} className="focus-ring mt-3 inline-block rounded-md font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                      {d.value}
                    </a>
                  )}
                </div>
              );
            })}

            <div className="rounded-xl bg-ink p-7 text-floral">
              <Logo onDark size={44} />
              <p className="mt-5 font-display text-xl font-light leading-snug">
                {isArabic ? "لديك مشروع أو تحدٍ يحتاج إلى تحليل؟" : "Have a project or challenge that needs analysis?"}
              </p>
              <p className="mt-3 text-base leading-relaxed text-bone/75">
                {isArabic ? "استخدم صفحة شاركنا مشكلتك لنفهم الوضع ونحدد الخطوة التالية" : "Use the challenge page so we can understand the situation and define the next step"}
              </p>
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-bone/50">{t.footer.followUs}</p>
                <SocialLinks onDark size="sm" />
              </div>
              <button
                type="button"
                onClick={() => navigate("share-challenge")}
                className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-camel/40 bg-camel/10 px-5 py-2.5 text-base font-medium text-floral transition-colors hover:bg-camel/20"
              >
                {isArabic ? "شاركنا مشكلتك" : c.directCta}
              </button>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}
