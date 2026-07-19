"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section-primitives";

type Props = {
  isArabic: boolean;
  weAreTitle: string;
  weAre: string[];
  weAreNotTitle: string;
  weAreNot: string[];
};

export function AboutIdentitySection({ isArabic, weAreTitle, weAre, weAreNotTitle, weAreNot }: Props) {
  return (
    <Section tone="floral">
      <SectionHeading
        align="center"
        eyebrow={isArabic ? "طريقتنا في العمل" : "How we work"}
        title={isArabic ? "ما الذي ستجده عندما تعمل معنا؟" : "What will you find when working with us?"}
        intro={isArabic ? "لا نبدأ بالأدوات، بل بالوضوح والصدق واختيار ما يخدم مشروعك فعلًا" : "We do not begin with tools, but with clarity, honesty, and what genuinely serves your business"}
        className="mx-auto"
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-7 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.article
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          whileHover={{ y: -6 }}
          className="rounded-2xl border border-camel/35 bg-background p-8 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-ink/[0.07] sm:p-10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel/15">
            <Check className="h-6 w-6 text-accent" />
          </div>
          <h3 className="mt-6 font-display text-3xl font-medium text-ink">{weAreTitle}</h3>
          <ul className="mt-7 space-y-4">
            {weAre.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-muted-foreground">
                <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.12 }}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-border bg-muted/40 p-8 transition-all duration-300 hover:border-camel/25 hover:bg-background hover:shadow-lg hover:shadow-ink/[0.05] sm:p-10"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-medium text-ink">{weAreNotTitle}</h3>
          <ul className="mt-7 space-y-4">
            {weAreNot.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-muted-foreground">
                <X className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/70" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.article>
      </div>
    </Section>
  );
}
