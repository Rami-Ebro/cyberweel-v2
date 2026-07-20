"use client";

import { motion } from "framer-motion";
import { Code2, Route, Search, TrendingUp } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section-primitives";

const icons = [Search, Route, Code2, TrendingUp];

type Props = {
  rtl: boolean;
};

export function HowWeHelpDelivery({ rtl }: Props) {
  const items = rtl
    ? [
        ["التقييم", "نفهم الوضع الحالي، ونراجع الاحتياج والمخاطر وما يستحق الأولوية"],
        ["التخطيط", "نحدّد الحل المناسب، ونحوّله إلى نطاق واضح وخطوات قابلة للتنفيذ"],
        ["التنفيذ", "نبني الحل أو نطوّر الموجود بمسؤوليات واضحة ونتائج يمكن متابعتها"],
        ["التطوير", "نقيس الأداء، نعالج نقاط الضعف، ونطوّر الحل بما يخدم المرحلة التالية"],
      ]
    : [
        ["Assessment", "We understand the current state, the need, the risks, and the real priority"],
        ["Planning", "We define the right solution and turn it into a clear, executable scope"],
        ["Execution", "We build or improve the solution with clear ownership and trackable outcomes"],
        ["Development", "We measure performance, address weaknesses, and improve the solution for the next stage"],
      ];

  return (
    <Section tone="background">
      <SectionHeading
        align="center"
        eyebrow={rtl ? "من التقييم إلى التطوير" : "From assessment to improvement"}
        title={
          rtl
            ? "من الفكرة إلى نتيجة قابلة للقياس"
            : "From an idea to a measurable outcome"
        }
        intro={
          rtl
            ? "قد تحتاج إلى بناء حل جديد، أو تحسين ما لديك، أو اكتشاف أن المشكلة ليست تقنية من الأساس. مهمتنا هي تحديد القرار الصحيح ثم تنفيذه بطريقة تخدم تقدّمك"
            : "You may need a new solution, an improvement to what you have, or the realization that the problem is not technical at all. Our role is to identify the right decision and execute it in a way that supports progress"
        }
        className="mx-auto"
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[index];

          return (
            <motion.div
              key={item[0]}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-camel/25 bg-background p-8 text-center shadow-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-camel/10">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium text-ink">
                {item[0]}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {item[1]}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
