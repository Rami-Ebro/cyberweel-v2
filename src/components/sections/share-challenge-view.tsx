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

  const REASSURANCE_ICONS = [MessageCircle, ShieldCheck, Clock];

  return (
    <div>
      <PageHeader
        eyebrow={s.eyebrow}
        title={
          <>
            {s.titleLine1}
            <br />
            <span className="text-accent">{s.titleLine2}</span>
          </>
        }
        intro={s.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          {/* Form */}
          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <h2 className="font-display text-2xl font-medium text-ink">
              {s.formHeading}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {s.formHint}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${s.eyebrow} — CyberWeel`}
                submitLabel={s.submitLabel}
                successMessage={s.successMessage}
                fields={s.fields.map((f) => ({ ...f, kind: f.rows ? "textarea" : "text" }))}
              />
            </div>
          </div>

          {/* Reassurance */}
          <aside className="space-y-6">
            {s.reassurance.map((r, i) => {
              const Icon = REASSURANCE_ICONS[i] ?? MessageCircle;
              return (
                <div
                  key={r.title}
                  className="rounded-xl border border-border bg-muted/50 p-6"
                >
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 font-display text-lg font-medium text-ink">
                    {r.title}
                  </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {r.text}
                </p>
              </div>
            );
          })}

          <div className="rounded-xl bg-ink p-6 text-floral">
            <p className="font-display text-lg">
              {s.directHeading}
            </p>
            <p className="mt-2 text-base text-bone/75">
                {s.directBody}
              </p>
              <a
                href={`mailto:${BRAND.email}`}
                className="focus-ring mt-2 inline-block rounded-md font-medium text-camel hover:underline"
              >
                {BRAND.email}
              </a>
            </div>
          </aside>
        </div>
      </Section>

      {/* Common questions — preempt frequent asks */}
      <Section tone="muted" className="section-texture !pt-0">
        <SectionHeading
          eyebrow={s.commonEyebrow}
          title={s.commonTitle}
          intro={s.commonIntro}
          className="mx-auto max-w-2xl"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {s.commonQuestions.map((cq) => (
            <div
              key={cq.q}
              className="rounded-xl border border-border bg-background p-6"
            >
              <HelpCircle className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-display text-base font-medium text-ink">
                {cq.q}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {cq.a}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
=======
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

  const REASSURANCE_ICONS = [MessageCircle, ShieldCheck, Clock];

  return (
    <div>
      <PageHeader
        eyebrow={s.eyebrow}
        title={
          <>
            {s.titleLine1}
            <br />
            <span className="text-accent">{s.titleLine2}</span>
          </>
        }
        intro={s.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          {/* Form */}
          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <h2 className="font-display text-2xl font-medium text-ink">
              {s.formHeading}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {s.formHint}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${s.eyebrow} — CyberWeel`}
                submitLabel={s.submitLabel}
                successMessage={s.successMessage}
                fields={s.fields.map((f) => ({ ...f, kind: f.rows ? "textarea" : "text" }))}
              />
            </div>
          </div>

          {/* Reassurance */}
          <aside className="space-y-6">
            {s.reassurance.map((r, i) => {
              const Icon = REASSURANCE_ICONS[i] ?? MessageCircle;
              return (
                <div
                  key={r.title}
                  className="rounded-xl border border-border bg-muted/50 p-6"
                >
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 font-display text-lg font-medium text-ink">
                    {r.title}
                  </h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {r.text}
                </p>
              </div>
            );
          })}

          <div className="rounded-xl bg-ink p-6 text-floral">
            <p className="font-display text-lg">
              {s.directHeading}
            </p>
            <p className="mt-2 text-base text-bone/75">
                {s.directBody}
              </p>
              <a
                href={`mailto:${BRAND.email}`}
                className="focus-ring mt-2 inline-block rounded-md font-medium text-camel hover:underline"
              >
                {BRAND.email}
              </a>
            </div>
          </aside>
        </div>
      </Section>

      {/* Common questions — preempt frequent asks */}
      <Section tone="muted" className="section-texture !pt-0">
        <SectionHeading
          eyebrow={s.commonEyebrow}
          title={s.commonTitle}
          intro={s.commonIntro}
          className="mx-auto max-w-2xl"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
          {s.commonQuestions.map((cq) => (
            <div
              key={cq.q}
              className="rounded-xl border border-border bg-background p-6"
            >
              <HelpCircle className="h-5 w-5 text-accent" />
              <h3 className="mt-4 font-display text-base font-medium text-ink">
                {cq.q}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {cq.a}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
