"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/site/i18n";

type CardCopy = readonly [string, string];

const AR_SITUATIONS: readonly CardCopy[] = [
  ["لدي مشروع ولا أعرف الخطوة التالية", "نرتب الصورة ونحدد القرار الأكثر أولوية بدل تشتيتك بعشرات الخيارات."],
  ["لدي مشكلة رقمية ولا أعرف سببها", "نفصل الأعراض عن السبب الحقيقي قبل البدء بأي تنفيذ."],
  ["أحتاج موقعًا أو نظامًا لكن أخشى الاختيار الخطأ", "نحدد ما تحتاجه فعلًا، وما يمكنك تأجيله، وما لا يستحق أن تدفع مقابله الآن."],
];

const EN_SITUATIONS: readonly CardCopy[] = [
  ["I have a project but not a clear next step", "We organize the picture and identify the highest-priority decision instead of overwhelming you with options."],
  ["I have a digital problem but do not know the cause", "We separate symptoms from the real cause before any execution begins."],
  ["I need a website or system but fear choosing wrong", "We define what you truly need, what can wait, and what is not worth paying for now."],
];

const AR_STEPS: readonly CardCopy[] = [
  ["نوضح المشكلة", "نحدد موضع الخلل الحقيقي والنتيجة التي تريد الوصول إليها."],
  ["نحدد القرار", "نرتب الخيارات ونختار الخطوة الأعلى أثرًا والأقل هدرًا."],
  ["نبني الحل", "موقع، نظام، هوية أو خطة نمو عندما يكون ذلك هو الحل الصحيح."],
  ["نرافق التنفيذ", "نتابع معك خطوة بخطوة حتى يصبح التقدم واضحًا وملموسًا."],
];

const EN_STEPS: readonly CardCopy[] = [
  ["Clarify the problem", "We identify the real bottleneck and the outcome you want to reach."],
  ["Define the decision", "We organize the options and choose the highest-impact, lowest-waste next step."],
  ["Build the solution", "A website, system, identity, or growth plan when that is truly the right solution."],
  ["Support execution", "We stay with you step by step until progress becomes clear and tangible."],
];

function getCards(grid: HTMLElement) {
  return Array.from(grid.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && !child.hasAttribute("aria-hidden")
  );
}

function updateCards(section: HTMLElement, copy: readonly CardCopy[]) {
  const grid = section.querySelector<HTMLElement>(".grid");
  if (!grid) return;

  let cards = getCards(grid);
  while (cards.length < copy.length && cards.length > 0) {
    const clone = cards[cards.length - 1]?.cloneNode(true) as HTMLElement | undefined;
    if (!clone) break;
    clone.querySelectorAll("svg").forEach((icon) => icon.remove());
    grid.appendChild(clone);
    cards = getCards(grid);
  }

  cards.forEach((card, index) => {
    if (index >= copy.length) {
      card.remove();
      return;
    }

    const item = copy[index];
    if (!item) return;

    card.classList.add(
      "h-full",
      "min-w-0",
      "hover:-translate-y-1.5",
      "hover:border-camel/60",
      "hover:bg-background",
      "hover:shadow-xl",
      "hover:shadow-ink/[0.08]"
    );

    const number = card.querySelector<HTMLElement>("span");
    const heading = card.querySelector<HTMLElement>("h3");
    const body = card.querySelector<HTMLElement>("p");

    if (number) {
      number.textContent = String(index + 1).padStart(2, "0");
      number.classList.remove("bg-white", "text-ink");
      number.classList.add("bg-ink", "text-floral", "transition-colors", "duration-300", "group-hover:bg-camel", "group-hover:text-ink");
    }
    if (heading) heading.textContent = item[0];
    if (body) body.textContent = item[1];
  });
}

function setColumns(grid: HTMLElement, wideCount: number, wideAt: number) {
  const width = window.innerWidth;
  const columns = width >= wideAt ? wideCount : width >= 640 ? 2 : 1;
  grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
}

export function LaunchSectionEnhancer() {
  const { dir } = useI18n();

  useEffect(() => {
    const ar = dir === "rtl";
    const situations = document.querySelector<HTMLElement>("#practical-help");
    const methodology = document.querySelector<HTMLElement>("#methodology");

    if (situations) {
      const eyebrow = situations.querySelector<HTMLElement>(".eyebrow-camel");
      const title = situations.querySelector<HTMLElement>("h2");
      const intro = title?.parentElement?.querySelector<HTMLElement>("p.mt-6");
      if (eyebrow) eyebrow.textContent = ar ? "ابدأ من وضعك الحقيقي" : "Start from where you are";
      if (title) title.textContent = ar ? "أيٌّ من هذه الحالات يشبهك؟" : "Which situation sounds like yours?";
      if (intro) intro.textContent = ar
        ? "لا تحتاج إلى معرفة الحل قبل أن تتواصل معنا. يكفي أن تعرف ما الذي يعيق تقدمك."
        : "You do not need to know the solution before contacting us. You only need to know what is blocking your progress.";
      updateCards(situations, ar ? AR_SITUATIONS : EN_SITUATIONS);
    }

    if (methodology) {
      const eyebrow = methodology.querySelector<HTMLElement>(".eyebrow-camel");
      const title = methodology.querySelector<HTMLElement>("h2");
      const intro = title?.parentElement?.querySelector<HTMLElement>("p.mt-6");
      if (eyebrow) eyebrow.textContent = ar ? "ماذا نفعل فعليًا؟" : "What we actually do";
      if (title) title.textContent = ar ? "من المشكلة الغامضة إلى خطوة قابلة للتنفيذ" : "From an unclear problem to an actionable step";
      if (intro) intro.textContent = ar
        ? "نرافقك من الفهم إلى القرار ثم التنفيذ، دون تعقيد أو تكاليف غير ضرورية."
        : "We guide you from understanding to decision and execution, without unnecessary complexity or costs.";
      updateCards(methodology, ar ? AR_STEPS : EN_STEPS);
    }

    const applyLayout = () => {
      const situationsGrid = situations?.querySelector<HTMLElement>(".grid");
      const methodologyGrid = methodology?.querySelector<HTMLElement>(".grid");
      if (situationsGrid) setColumns(situationsGrid, 3, 900);
      if (methodologyGrid) setColumns(methodologyGrid, 4, 640);
    };

    applyLayout();
    window.addEventListener("resize", applyLayout);
    return () => window.removeEventListener("resize", applyLayout);
  }, [dir]);

  return null;
}
