"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/site/i18n";

const AR_CARDS = [
  ["لدي مشروع ولا أعرف الخطوة التالية", "نرتب الصورة ونحدد القرار الأكثر أولوية بدل تشتيتك بعشرات الخيارات."],
  ["لدي مشكلة رقمية ولا أعرف سببها", "نفصل الأعراض عن السبب الحقيقي قبل البدء بأي تنفيذ."],
  ["أحتاج موقعًا أو نظامًا لكن أخشى الاختيار الخطأ", "نحدد ما تحتاجه فعلًا، وما يمكنك تأجيله، وما لا يستحق أن تدفع مقابله الآن."],
];

const EN_CARDS = [
  ["I have a project but not a clear next step", "We organize the picture and identify the highest-priority decision instead of overwhelming you with options."],
  ["I have a digital problem but do not know the cause", "We separate symptoms from the real cause before any execution begins."],
  ["I need a website or system but fear choosing wrong", "We define what you truly need, what can wait, and what is not worth paying for now."],
];

export function LaunchSectionEnhancer() {
  const { dir } = useI18n();

  useEffect(() => {
    const section = document.querySelector<HTMLElement>("#practical-help");
    if (!section) return;

    const ar = dir === "rtl";
    const eyebrow = section.querySelector<HTMLElement>(".eyebrow-camel");
    const title = section.querySelector<HTMLElement>("h2");
    const intro = title?.parentElement?.querySelector<HTMLElement>("p.mt-6");
    const grid = section.querySelector<HTMLElement>(".grid");
    const cards = grid ? Array.from(grid.children) as HTMLElement[] : [];
    const copy = ar ? AR_CARDS : EN_CARDS;

    if (eyebrow) eyebrow.textContent = ar ? "ابدأ من وضعك الحقيقي" : "Start from where you are";
    if (title) title.textContent = ar ? "أيٌّ من هذه الحالات يشبهك؟" : "Which situation sounds like yours?";
    if (intro) intro.textContent = ar
      ? "لا تحتاج إلى معرفة الحل قبل أن تتواصل معنا. يكفي أن تعرف ما الذي يعيق تقدمك."
      : "You do not need to know the solution before contacting us. You only need to know what is blocking your progress.";

    if (grid) {
      grid.classList.remove("md:grid-cols-2", "lg:grid-cols-4");
      grid.classList.add("md:grid-cols-3");
    }

    cards.forEach((card, index) => {
      if (index >= 3) {
        card.remove();
        return;
      }

      const number = card.querySelector<HTMLElement>("span");
      const heading = card.querySelector<HTMLElement>("h3");
      const body = card.querySelector<HTMLElement>("p");

      card.classList.add(
        "hover:-translate-y-1.5",
        "hover:border-camel/60",
        "hover:bg-background",
        "hover:shadow-xl",
        "hover:shadow-ink/[0.08]"
      );

      if (number) {
        number.classList.remove("bg-white", "text-ink");
        number.classList.add(
          "bg-ink",
          "text-floral",
          "transition-colors",
          "duration-300",
          "group-hover:bg-camel",
          "group-hover:text-ink"
        );
      }

      if (heading) heading.textContent = copy[index][0];
      if (body) body.textContent = copy[index][1];
    });
  }, [dir]);

  return null;
}
