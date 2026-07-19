import { Section, SectionHeading } from "@/components/site/section-primitives";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqSection({ copy }: { copy: any }) {
  return (
    <Section tone="floral" id="faq">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
        <div className="rounded-2xl border border-border bg-white p-2 sm:p-4">
          <Accordion type="single" collapsible defaultValue="faq-0" className="w-full">
            {copy.items.map(([question, answer]: readonly [string, string], i: number) => (
              <AccordionItem key={question} value={`faq-${i}`} className="border-b border-border last:border-b-0">
                <AccordionTrigger className="px-4 py-5 text-start font-display text-lg font-medium text-ink hover:no-underline hover:text-accent">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-5 text-base leading-relaxed text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}
