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
    <Section tone="floral" className="!pt-20 sm:!pt-24">
      <SectionHeading
        align="center"
        eyebrow={isArabic ? "طريقتنا في العمل" : "How we work"}
        title={isArabic ? "ما الذي ستجده عندما تعمل معنا؟" : "What will you find when working with us?"}
        intro={isArabic ? "لا نبدأ بالأدوات، بل بالوضوح والصدق واختيار ما يخدم مشروعك فعلًا" : "We do not begin with tools, but with clarity, honesty, and what genuinely serves your business"}
        className="mx-auto"
      />

      <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
        <motion.article
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          whileHover={{ y: -6 }}
          className="rounded-2xl border border-camel/50 bg-background p-9 shadow-lg shadow-ink/[0.06] transition-all duration-300 hover:border-camel/70 hover:shadow-xl hover:shadow-ink/[0.09] sm:p-11"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-camel/18">
            <Check className="h-7 w-7 text-accent" />
          </div>
          <h3 className="mt-7 font-display text-3xl font-semibold text-ink sm:text-4xl">{weAreTitle}</h3>
          <ul className="mt-8 space-y-5">
            {weAre.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-ink/75 sm:text-lg">
                <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.12 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border border-border/70 bg-muted/20 p-7 opacity-80 transition-all duration-300 hover:border-border hover:bg-muted/30 hover:opacity-95 sm:p-8"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/70">
            <X className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <h3 className="mt-5 font-display text-xl font-medium text-ink/80 sm:text-2xl">{weAreNotTitle}</h3>
          <ul className="mt-6 space-y-3.5">
            {weAreNot.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground/80">
                <X className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.article>
      </div>
    </Section>
  );
}
