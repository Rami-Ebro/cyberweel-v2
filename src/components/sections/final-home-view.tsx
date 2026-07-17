"use client";

import { useI18n } from "@/components/site/i18n";
import { SectionProgress } from "@/components/site/section-progress";
import { launchCopy } from "./launch-home-copy";
import { FinalHero } from "./final-home/hero";
import { NumberedCards } from "./final-home/numbered-cards";
import { AreasSection } from "./final-home/areas";
import { WhySection } from "./final-home/why";
import { PrinciplesSection } from "./final-home/principles";
import { CaseStudySection } from "./final-home/case-study";
import { FaqSection } from "./final-home/faq";
import { FinalCta } from "./final-home/final-cta";

export function FinalHomeView() {
  const { t } = useI18n();
  const isArabic = t.dir === "rtl";
  const copy = isArabic ? launchCopy.ar : launchCopy.en;
  const methodology = isArabic
    ? "وضوح ← قرار ← تقدّم"
    : "Clarity → Decision → Progress";
  const processIntro = isArabic
    ? "وضوح ← قرار ← تقدّم هي منهجيتنا. والخطوات الأربع التالية هي طريقتنا العملية لتطبيقها من الفهم حتى التنفيذ."
    : copy.process.intro;

  return (
    <div>
      <FinalHero copy={copy.hero} methodology={methodology} />
      <NumberedCards id="situations" eyebrow={copy.situations.eyebrow} title={copy.situations.title} intro={copy.situations.intro} items={copy.situations.items} columns={3} />
      <NumberedCards id="process" tone="muted" eyebrow={copy.process.eyebrow} title={copy.process.title} intro={processIntro} items={copy.process.items} columns={4} />
      <AreasSection copy={copy.areas} />
      <WhySection copy={copy.why} />
      <PrinciplesSection copy={copy.principles} />
      <CaseStudySection />
      <FaqSection copy={copy.faq} />
      <FinalCta copy={copy.final} />
      <SectionProgress
        sections={[
          { id: "hero", label: isArabic ? "الرئيسية" : "Home" },
          { id: "situations", label: copy.situations.eyebrow },
          { id: "process", label: copy.process.eyebrow },
          { id: "areas", label: copy.areas.eyebrow },
          { id: "why", label: copy.why.eyebrow, dark: true },
          { id: "principles", label: copy.principles.eyebrow },
          { id: "case-study", label: isArabic ? "حالة عمل حقيقية" : "Real case study" },
          { id: "faq", label: copy.faq.eyebrow },
          { id: "share-challenge", label: copy.final.secondary, dark: true },
        ]}
      />
    </div>
  );
}
