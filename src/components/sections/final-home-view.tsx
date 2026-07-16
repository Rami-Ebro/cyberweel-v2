"use client";

import { useI18n } from "@/components/site/i18n";
import { SectionProgress } from "@/components/site/section-progress";
import { launchCopy } from "./launch-home-copy";
import { FinalHero } from "./final-home/hero";
import { NumberedCards } from "./final-home/numbered-cards";
import { AreasSection } from "./final-home/areas";
import { WhySection } from "./final-home/why";
import { PrinciplesSection } from "./final-home/principles";
import { FaqSection } from "./final-home/faq";
import { FinalCta } from "./final-home/final-cta";

export function FinalHomeView() {
  const { t } = useI18n();
  const copy = t.dir === "rtl" ? launchCopy.ar : launchCopy.en;

  return (
    <div>
      <FinalHero copy={copy.hero} />
      <NumberedCards id="situations" eyebrow={copy.situations.eyebrow} title={copy.situations.title} intro={copy.situations.intro} items={copy.situations.items} columns={3} />
      <NumberedCards id="process" tone="muted" eyebrow={copy.process.eyebrow} title={copy.process.title} intro={copy.process.intro} items={copy.process.items} columns={4} />
      <AreasSection copy={copy.areas} />
      <WhySection copy={copy.why} />
      <PrinciplesSection copy={copy.principles} />
      <FaqSection copy={copy.faq} />
      <FinalCta copy={copy.final} />
      <SectionProgress
        sections={[
          { id: "hero", label: t.dir === "rtl" ? "الرئيسية" : "Home" },
          { id: "situations", label: copy.situations.eyebrow },
          { id: "process", label: copy.process.eyebrow },
          { id: "areas", label: copy.areas.eyebrow },
          { id: "why", label: copy.why.eyebrow },
          { id: "principles", label: copy.principles.eyebrow },
          { id: "faq", label: copy.faq.eyebrow },
          { id: "share-challenge", label: copy.final.secondary },
        ]}
      />
    </div>
  );
}
