"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/site/i18n";

const AR_SITUATIONS = [
  ["لدي مشروع ولا أعرف الخطوة التالية", "نرتب الصورة ونحدد القرار الأكثر أولوية بدل تشتيتك بعشرات الخيارات."],
  ["لدي مشكلة رقمية ولا أعرف سببها", "نفصل الأعراض عن السبب الحقيقي قبل البدء بأي تنفيذ."],
  ["أحتاج موقعًا أو نظامًا لكن أخشى الاختيار الخطأ", "نحدد ما تحتاجه فعلًا، وما يمكنك تأجيله، وما لا يستحق أن تدفع مقابله الآن."],
];

const EN_SITUATIONS = [
  ["I have a project but not a clear next step", "We organize the picture and identify the highest-priority decision instead of overwhelming you with options."],
  ["I have a digital problem but do not know the cause", "We separate symptoms from the real cause before any execution begins."],
  ["I need a website or system but fear choosing wrong", "We define what you truly need, what can wait, and what is not worth paying for now."],
];

const AR_STEPS = [
  ["نوضح المشكلة", "نحدد موضع الخلل الحقيقي والنتيجة التي تريد الوصول إليها."],
  ["نحدد القرار", "نرتب الخيارات ونختار الخطوة الأعلى أثرًا والأقل هدرًا."],
  ["نبني الحل", "موقع، نظام، هوية أو خطة نمو عندما يكون ذلك هو الحل الصحيح."],
  ["نرافق التنفيذ", "نتابع معك خطوة بخطوة حتى يصبح التقدم واضحًا وملموسًا."],
];

const EN_STEPS = [
  ["Clarify the problem", "We identify the real bottleneck and the outcome you want to reach."],
  ["Define the decision", "We organize the options and choose the highest-impact, lowest-waste next step."],
  ["Build the solution", "A website, system, identity, or growth plan when that is truly the right solution."],
  ["Support execution", "We stay with you step by step until progress becomes clear and tangible."],
];

function updateCards(section: HTMLElement, copy: string[][], count: number) {
  const grid = section.querySelector<HTMLElement>(".grid");
  if (!grid) return;

  let cards = Array.from(grid.children) as HTMLElement[];
  while (cards.length < count && cards.length > 0) {
    const clone = cards[cards.length - 1].cloneNode(true) as HTMLElement;
    clone.querySelectorAll("svg").forEach((icon) => icon.remove());
    grid.appendChild(clone);
    cards = Array.from(grid.children) as HTMLElement[];
  }

  cards.forEach((card, index) => {
    if (index >= count) {
      card.remove();
      return;
    }

    const number = card.querySelector<HTMLElement>("span");
    const heading = card.querySelector<HTMLElement>("h3");
    const body = card.querySelector<HTMLElement>("p");

    card.classList.add(
      "h-full",
      "min-w-0",
      "hover:-translate-y-1.5",
      "hover:border-camel/60",
      "hover:bg-background",
      "hover:shadow-xl",
      "hover:shadow-ink/[0.08]"
    );

    if (number) {
      number.textContent = String(index + 1).padStart(2, "0");
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
}

export function LaunchSectionEnhancer() {
  const { dir } = useI18n();

  useEffect(() => {
    const ar = dir === "rtl";

    const situations = document.querySelector<HTMLElement>("#practical-help");
    if (situations) {
      const eyebrow = situations.querySelector<HTMLElement>(".eyebrow-camel");
      const title = situations.querySelector<HTMLElement>("h2");
      const intro = title?.parentElement?.querySelector<HTMLElement>("p.mt-6");
      const grid = situations.querySelector<HTMLElement>(".grid");

      if (eyebrow) eyebrow.textContent = ar ? "ابدأ من وضعك الحقيقي" : "Start from where you are";
      if (title) title.textContent = ar ? "أيٌّ من هذه الحالات يشبهك؟" : "Which situation sounds like yours?";
      if (intro) intro.textContent = ar
        ? "لا تحتاج إلى معرفة الحل قبل أن تتواصل معنا. يكفي أن تعرف ما الذي يعيق تقدمك."
        : "You do not need to know the solution before contacting us. You only need to know what is blocking your progress.";

      if (grid) {
        grid.className = "relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3";
      }
      updateCards(situations, ar ? AR_SITUATIONS : EN_SITUATIONS, 3);
    }

    const methodology = document.querySelector<HTMLElement>("#methodology");
    if (methodology) {
      const eyebrow = methodology.querySelector<HTMLElement>(".eyebrow-camel");
      const title = methodology.querySelector<HTMLElement>("h2");
      const intro = title?.parentElement?.querySelector<HTMLElement>("p.mt-6");
      const grid = methodology.querySelector<HTMLElement>(".grid");

      if (eyebrow) eyebrow.textContent = ar ? "ماذا نفعل فعليًا؟" : "What we actually do";
      if (title) title.textContent = ar
        ? "من المشكلة الغامضة إلى خطوة قابلة للتنفيذ"
        : "From an unclear problem to an actionable step";
      if (intro) intro.textContent = ar
        ? "نرافقك من الفهم إلى القرار ثم التنفيذ، دون تعقيد أو تكاليف غير ضرورية."
        : "We guide you from understanding to decision and execution, without unnecessary complexity or costs.";

      if (grid) {
        grid.className = "relative mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4";
      }
      updateCards(methodology, ar ? AR_STEPS : EN_STEPS, 4);
    }
  }, [dir]);

  return null;
}
