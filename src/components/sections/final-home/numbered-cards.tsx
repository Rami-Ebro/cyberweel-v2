"use client";

import { motion } from "framer-motion";
import { Section, SectionHeading } from "@/components/site/section-primitives";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.07 } }),
};

export function NumberedCards({
  id,
  tone = "floral",
  eyebrow,
  title,
  intro,
  items,
  columns,
}: {
  id: string;
  tone?: "floral" | "muted";
  eyebrow: string;
  title: string;
  intro: string;
  items: readonly (readonly [string, string])[];
  columns: 3 | 4;
}) {
  const grid = columns === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3";

  return (
    <Section tone={tone} id={id}>
      <SectionHeading align="center" eyebrow={eyebrow} title={title} intro={intro} className="mx-auto" />
      <div className={`mt-14 grid gap-6 ${grid}`}>
        {items.map(([itemTitle, text], i) => (
          <motion.article
            key={itemTitle}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="group rounded-xl border border-border bg-white p-7 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-camel/60 hover:shadow-xl hover:shadow-ink/[0.08]"
          >
            <span className="inline-flex rounded-md bg-ink px-3 py-1 font-display text-sm font-semibold tracking-[0.2em] text-floral transition-colors group-hover:bg-camel group-hover:text-ink">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 font-display text-2xl font-light text-ink sm:text-3xl">{itemTitle}</h3>
            <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-muted-foreground">{text}</p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
