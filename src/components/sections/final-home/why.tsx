import { ArchMotif } from "@/components/brand/motif";
import { Logo } from "@/components/brand/logo";
import { Section } from "@/components/site/section-primitives";

export function WhySection({ copy }: { copy: any }) {
  return (
    <Section tone="ink" id="why" className="section-texture-dark relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12]">
        <ArchMotif size={520} onDark />
      </div>
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="eyebrow !text-white">{copy.eyebrow}</p>
        <h2 className="mt-6 font-display text-3xl font-light leading-tight text-white sm:text-4xl lg:text-5xl">{copy.title}</h2>
        <p className="mt-7 text-lg leading-relaxed text-white/80">{copy.body}</p>
        <div className="mt-10 inline-flex flex-col items-center gap-3">
          <Logo onDark size={56} />
          <p className="font-display text-base text-white/70">{copy.note}</p>
        </div>
      </div>
    </Section>
  );
}
