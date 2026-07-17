"use client";

import { useI18n } from "@/components/site/i18n";
import { Section, SectionHeading } from "@/components/site/section-primitives";

export function CaseStudySection() {
  const { t } = useI18n();
  const ar = t.dir === "rtl";

  const copy = ar
    ? {
        eyebrow: "حالة عمل حقيقية",
        title: "CyberWeel: من فكرة واسعة إلى عرض أوضح",
        intro: "هذا الموقع نفسه مثال على طريقة عملنا: بدأنا من مشكلة في الوضوح، ثم اتخذنا قرارات محددة، ثم حولناها إلى تجربة رقمية أكثر مباشرة.",
        items: [
          ["المشكلة", "كانت الرسالة واسعة، والخدمات غير واضحة بما يكفي، والدعوات إلى الفعل غير موحدة."],
          ["القرار", "ثبّتنا تموضع CyberWeel كشريك تقدّم يبدأ بالفهم والقرار قبل التنفيذ."],
          ["التنفيذ", "أعدنا بناء الصفحة الرئيسية، ووحّدنا الأزرار، ووضّحنا المنهجية، وبسّطنا مسار التواصل."],
          ["النتيجة", "موقع يشرح بوضوح ماذا نفعل، ولمن، وكيف يبدأ التعاون—دون ادعاءات أو أرقام غير مثبتة."],
        ],
      }
    : {
        eyebrow: "Real case study",
        title: "CyberWeel: from a broad idea to a clearer offer",
        intro: "This website is itself an example of our process: we started with a clarity problem, made focused decisions, and turned them into a more direct digital experience.",
        items: [
          ["Problem", "The message was broad, services were not explicit enough, and calls to action were inconsistent."],
          ["Decision", "We positioned CyberWeel as a progress partner that begins with understanding and decision before execution."],
          ["Execution", "We rebuilt the homepage, unified calls to action, clarified the methodology, and simplified the contact path."],
          ["Outcome", "A site that clearly explains what we do, for whom, and how collaboration begins—without invented claims or numbers."],
        ],
      };

  return (
    <Section tone="muted">
      <SectionHeading eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {copy.items.map(([title, text]) => (
          <article key={title} className="rounded-xl border border-border bg-background p-6">
            <h3 className="font-display text-xl font-medium text-ink">{title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
