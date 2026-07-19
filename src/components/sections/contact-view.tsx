"use client";

import { PageHeader } from "@/components/site/page-header";
import { Section } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { ContactSidebar } from "@/components/sections/contact-sidebar";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

export function ContactView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const c = t.contact;
  const isArabic = t.dir === "rtl";

  return (
    <div>
      <PageHeader
        eyebrow={isArabic ? "تواصل معنا" : "Contact us"}
        title={
          <>
            {isArabic ? "لنبقَ" : "Let’s stay"}
            <br />
            <span className="text-accent">{isArabic ? "على تواصل" : "in touch"}</span>
          </>
        }
        intro={isArabic ? "لديك استفسار عام، أو فكرة تعاون، أو رسالة لفريق CyberWeel؟ اكتب لنا وسنوجّه رسالتك إلى الشخص المناسب" : "Have a general question, partnership idea, or message for CyberWeel? Write to us and we will direct it to the right person"}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.78fr] lg:gap-16">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
            <h2 className="font-display text-3xl font-medium text-ink">{isArabic ? "أرسل رسالتك" : c.formHeading}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{isArabic ? "اكتب رسالتك وسنوجّهها إلى الشخص المناسب" : c.formHint}</p>
            <p className="mt-2 text-sm font-medium text-accent">{isArabic ? "عادةً نرد خلال يومي عمل" : "We usually reply within two business days"}</p>
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

          <ContactSidebar isArabic={isArabic} onProject={() => navigate("share-challenge")} />
        </div>
      </Section>
    </div>
  );
}
