"use client";

import { motion } from "framer-motion";
import { Section, SectionHeading } from "@/components/site/section-primitives";

type Props = {
  rtl: boolean;
};

export function HowWeHelpProcess({ rtl }: Props) {
  const items = rtl
    ? [
        ["وضوح", "نصغي، نفهم السياق، ونحدّد أصل المشكلة وما يستحق الأولوية"],
        ["قرار", "نقارن الخيارات ونختار المسار الأنسب لواقع مشروعك"],
        ["تنفيذ", "نبني الحل أو نحسّنه بخطوات واضحة ومسؤوليات محددة"],
        ["تقدّم", "نقيس النتيجة ونطوّر ما يلزم للوصول إلى تقدّم ملموس"],
      ]
    : [
        ["Clarity", "We listen, understand the context, and identify the real priority"],
        ["Decision", "We compare options and choose the path that fits your business"],
        ["Execution", "We build or improve the solution through clear, accountable steps"],
        ["Progress", "We measure outcomes and refine what is needed for tangible progress"],
      ];

  return (
    <Section tone="floral">
      <SectionHeading
        align="center"
        eyebrow={rtl ? "كيف نعمل" : "How we work"}
        title={rtl ? "وضوح، قرار، تنفيذ، تقدّم" : "Clarity, decision, execution, progress"}
        intro={
          rtl
            ? "منهجية واحدة تقود كل تعاون من فهم المشكلة إلى نتيجة قابلة للقياس"
            : "One methodology guides every engagement from understanding the problem to a measurable result"
        }
        className="mx-auto"
      />

      <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item[0]}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="rounded-xl border border-border bg-background p-8"
          >
            <span className="font-display text-sm font-semibold text-accent">
              0{index + 1}
            </span>
            <h3 className="mt-4 font-display text-2xl font-medium text-ink">
              {item[0]}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {item[1]}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
