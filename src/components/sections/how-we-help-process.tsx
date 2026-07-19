"use client";

import { motion } from "framer-motion";
import { Section, SectionHeading } from "@/components/site/section-primitives";

type Props = {
  rtl: boolean;
};

export function HowWeHelpProcess({ rtl }: Props) {
  const items = rtl
    ? [
        ["إصغاء", "نبدأ بفهم أين أنت اليوم، وسياق عملك، وما تحاول حلّه فعلًا"],
        ["إيضاح", "نفصل الإشارة عن الضجيج، ونحدّد أصل المشكلة وما يستحق الأولوية"],
        ["قرار", "نقارن الخيارات الواقعية ونختار المسار الأنسب لواقع مشروعك"],
        ["تحرّك", "نحوّل القرار إلى خطوات واضحة، ثم ننفّذ ونقيس التقدّم"],
      ]
    : [
        ["Listen", "We begin by understanding where you are, your context, and what you are truly trying to solve"],
        ["Clarify", "We separate signal from noise and identify the real problem and priority"],
        ["Decide", "We compare realistic options and choose the path that fits your business"],
        ["Move", "We turn the decision into clear steps, execute, and measure progress"],
      ];

  return (
    <Section tone="floral">
      <SectionHeading
        align="center"
        eyebrow={rtl ? "كيف نعمل" : "How we work"}
        title={rtl ? "إيقاع هادئ ومدروس" : "A calm, deliberate rhythm"}
        intro={
          rtl
            ? "نبدأ بالفهم، ولا نتحرّك قبل أن تصبح الخطوة التالية واضحة"
            : "We begin with understanding and do not move until the next step is clear"
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
