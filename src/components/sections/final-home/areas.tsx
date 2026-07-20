"use client";

import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";

export function AreasSection({ copy }: { copy: any }) {
  const { navigate } = useNav();
  const isArabic = copy.eyebrow === "ماذا ننفّذ؟";

  return (
    <Section tone="floral" id="areas">
      <SectionHeading
        align="center"
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        className="mx-auto"
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {copy.items.map(([title, text]: readonly [string, string]) => (
          <article
            key={title}
            className="rounded-xl border border-border bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:bg-[#ece7da] hover:shadow-md"
          >
            <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => navigate("how-we-help")}
          className="focus-ring group inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-camel px-6 text-base font-semibold text-ink transition-colors hover:bg-camel/90"
        >
          {isArabic ? "اكتشف كيف نساعدك" : "Explore how we help"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </button>
      </div>
    </Section>
  );
}
