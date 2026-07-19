import { Section, SectionHeading } from "@/components/site/section-primitives";

export function PrinciplesSection({ copy }: { copy: any }) {
  return (
    <Section tone="floral" id="principles">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <SectionHeading eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
        <ol className="relative">
          <span aria-hidden className="absolute bottom-2 top-2 w-px bg-border rtl:right-0 ltr:left-0" />
          {copy.items.map(([title, text]: readonly [string, string], i: number) => (
            <li key={title} className="group relative flex items-start gap-6 py-7 rtl:pr-8 ltr:pl-8">
              <span className="font-display text-2xl font-light text-bone transition-colors group-hover:text-accent">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-display text-xl font-medium text-ink">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{text}</p>
              </div>
              <span aria-hidden className="absolute top-9 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-camel bg-background transition-colors group-hover:bg-camel ltr:left-0 rtl:right-0 rtl:translate-x-1/2" />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
