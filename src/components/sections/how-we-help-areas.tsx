"use client";

import { motion } from "framer-motion";
import { Bot, MonitorSmartphone, Settings2, ShieldCheck } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section-primitives";

const icons = [MonitorSmartphone, Settings2, Bot, ShieldCheck];

const arResults = [
  "النتيجة: حضور رقمي احترافي يساعدك على جذب العملاء وتحويل الزيارات إلى خطوات فعلية",
  "النتيجة: عمليات أكثر تنظيمًا، أخطاء أقل، ورؤية أوضح لما يحدث داخل العمل",
  "النتيجة: وقت أقل في الأعمال الروتينية، سرعة أكبر في التنفيذ، وقدرة أفضل على التوسع",
  "النتيجة: بيئة رقمية أكثر أمانًا، واستمرارية أفضل للعمل، وثقة أكبر لدى العملاء والشركاء",
];

const enResults = [
  "Result: a professional digital presence that turns visits into meaningful action",
  "Result: better-organized operations, fewer errors, and clearer business visibility",
  "Result: less routine work, faster execution, and stronger ability to scale",
  "Result: stronger digital protection, better continuity, and greater stakeholder trust",
];

type Props = {
  rtl: boolean;
  areas: { title: string; text: string }[];
};

export function HowWeHelpAreas({ rtl, areas }: Props) {
  const results = rtl ? arResults : enResults;

  return (
    <Section tone="muted" className="section-texture !pt-24 sm:!pt-28">
      <SectionHeading
        eyebrow={rtl ? "ماذا ننفّذ" : "What we deliver"}
        title={
          rtl
            ? "حلول رقمية وتنفيذية واضحة"
            : "Clear digital solutions and execution"
        }
        intro={
          rtl
            ? "لا نتوقف عند تقديم الأفكار أو التوصيات. نقيّم احتياج عملك، نحدّد الحل المناسب، ثم نخطط له وننفّذه ونطوّره معك"
            : "We do not stop at ideas or recommendations. We assess the need, define the right solution, plan it, build it, and improve it with you"
        }
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {areas.map((area, index) => {
          const Icon = icons[index] || MonitorSmartphone;

          return (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="rounded-xl border border-border bg-background p-7 transition-all hover:border-camel/40 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-camel/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-5 font-display text-xl font-medium text-ink">
                {area.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {area.text}
              </p>
              <p className="mt-4 border-t border-border/70 pt-4 text-sm font-medium leading-relaxed text-ink/70">
                {results[index]}
              </p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
