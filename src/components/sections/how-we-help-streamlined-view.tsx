"use client";

import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={<>{h.titleLine1}<br /><span className="text-accent">{h.titleLine2}</span></>}
        intro={h.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <SectionHeading
          align="center"
          eyebrow={h.processEyebrow}
          title={h.processTitle}
          intro={h.processIntro}
          className="mx-auto"
        />
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
          {h.process.map((p) => (
            <article key={p.n} className="rounded-xl border border-border bg-background p-7">
              <span className="font-display text-xl text-accent">{p.n}</span>
              <h3 className="mt-4 font-display text-2xl font-medium text-ink">{p.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          ))}
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
