import { Section, SectionHeading } from "@/components/site/section-primitives";

export function AreasSection({ copy }: { copy: any }) {
  return (
    <Section tone="floral" id="areas">
      <SectionHeading align="center" eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} className="mx-auto" />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {copy.items.map(([title, text]: readonly [string, string], i: number) => (
          <article key={title} className="group rounded-xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-5 font-display text-2xl font-medium text-ink">{title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
