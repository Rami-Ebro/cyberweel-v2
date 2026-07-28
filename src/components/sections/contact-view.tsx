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
        eyebrow={isArabic ? "تواصل معنا" : "Contact CyberWeel"}
        title={
          <>
            {isArabic ? "لنبقَ" : "Start with a"}
            <br />
            <span className="text-accent">{isArabic ? "على تواصل" : "simple conversation"}</span>
          </>
        }
        intro={
          isArabic
            ? "لديك استفسار عام، أو فكرة تعاون، أو رسالة لفريق CyberWeel؟ اكتب لنا وسنوجّه رسالتك إلى الشخص المناسب"
            : "Have a general question, partnership idea, or message for the CyberWeel team? Write to us and we will make sure it reaches the right person."
        }
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.78fr] lg:gap-16">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
            <h2 className="font-display text-3xl font-medium text-ink">
              {isArabic ? "أرسل رسالتك" : "Send us a message"}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {isArabic
                ? "اكتب رسالتك وسنوجّهها إلى الشخص المناسب"
                : "Tell us what you would like to discuss, and we will direct your message to the person best placed to respond."}
            </p>
            <p className="mt-2 text-sm font-medium text-accent">
              {isArabic ? "عادةً نرد خلال يومي عمل" : "We usually respond within two business days."}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${isArabic ? "رسالة عامة" : "General Enquiry"} — CyberWeel`}
                submitLabel={isArabic ? c.submitLabel : "Send Message"}
                successMessage={
                  isArabic
                    ? "وصلت رسالتك بنجاح، وسنتواصل معك قريبًا"
                    : "Your message is ready. We will review it and get back to you as soon as we can."
                }
                allowAttachments
                fields={c.fields.map((field) => ({
                  ...field,
                  ...(isArabic
                    ? {}
                    : field.name === "name"
                      ? { label: "Your name", placeholder: "What should we call you?" }
                      : field.name === "email"
                        ? { label: "Email", placeholder: "you@example.com" }
                        : field.name === "message"
                          ? {
                              label: "Your message",
                              placeholder: "Tell us what you would like to discuss, ask, or explore.",
                            }
                          : {}),
                  kind: field.rows ? "textarea" : "text",
                }))}
              />
            </div>
          </div>

          <ContactSidebar isArabic={isArabic} onProject={() => navigate("share-challenge")} />
        </div>
      </Section>
    </div>
  );
}
