"use client";

import { useI18n } from "@/components/site/i18n";
import { Section } from "@/components/site/section-primitives";

export function CaseStudySection() {
  const { t } = useI18n();
  const ar = t.dir === "rtl";

  const copy = ar
    ? {
        eyebrow: "حالة عمل حقيقية",
        title: "من فكرة واسعة إلى عرض أوضح",
        intro: "هذا الموقع نفسه مثال على طريقة عملنا: بدأنا من مشكلة في الوضوح، ثم اتخذنا قرارات محددة، ثم حولناها إلى تجربة رقمية أكثر مباشرة",
        items: [
          ["المشكلة", "كانت الرسالة واسعة، والخدمات غير واضحة بما يكفي، والدعوات إلى الفعل غير موحدة"],
          ["القرار", "ثبّتنا تموضع CyberWeel كشريك تقدّم يبدأ بالفهم والقرار قبل التنفيذ"],
          ["التنفيذ", "أعدنا بناء الصفحة الرئيسية، ووحّدنا الأزرار، ووضّحنا المنهجية، وبسّطنا مسار التواصل"],
          ["النتيجة", "موقع يشرح بوضوح ماذا نفعل، ولمن، وكيف يبدأ التعاون—دون ادعاءات أو أرقام غير مثبتة"],
        ],
      }
    : {
        eyebrow: "Real case study",
        title: "From a broad idea to a clearer offer",
        intro: "This website is itself an example of our process: we started with a clarity problem, made focused decisions, and turned them into a more direct digital experience",
        items: [
          ["Problem", "The message was broad, services were not explicit enough, and calls to action were inconsistent"],
          ["Decision", "We positioned CyberWeel as a progress partner that begins with understanding and decision before execution"],
          ["Execution", "We rebuilt the homepage, unified calls to action, clarified the methodology, and simplified the contact path"],
          ["Outcome", "A site that clearly explains what we do, for whom, and how collaboration begins—without invented claims or numbers"],
        ],
      };

  return (
    <Section id="case-study" tone="muted">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow-camel">{copy.eyebrow}</p>
        <span
          aria-label="CyberWeel"
          className="mx-auto mt-5 block h-[42px] w-[164px] bg-ink"
          style={{
            WebkitMaskImage: "url('/cyberweel-wordmark.svg')",
            maskImage: "url('/cyberweel-wordmark.svg')",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        <h2 className="mt-5 font-display text-3xl font-normal leading-tight text-ink sm:text-4xl lg:text-5xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
          {copy.intro}
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {copy.items.map(([title, text]) => (
          <article
            key={title}
            className="rounded-xl border border-border bg-background p-6 transition duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:border-accent/60 hover:shadow-lg motion-reduce:transform-none"
          >
            <h3 className="text-xl font-bold text-ink">{title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
