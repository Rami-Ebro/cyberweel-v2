import { Section, SectionHeading } from "@/components/site/section-primitives";

const DELIVERABLES_AR = [
  "تشخيص رقمي، ترتيب الأولويات، وخريطة قرار",
  "مواقع، متاجر، منصات، تطبيقات وأنظمة مخصصة",
  "هوية بصرية، تموضع، ورسائل العلامة",
  "خطط نمو، حملات، صفحات هبوط ومسارات تحويل",
  "أتمتة، ربط أدوات، لوحات إدارة وأنظمة تشغيل",
  "مراجعة المشاريع والعروض والخطط قبل الاستثمار فيها",
] as const;

const DELIVERABLES_EN = [
  "Digital diagnosis, priorities, and a decision roadmap",
  "Websites, stores, platforms, applications, and custom systems",
  "Visual identity, positioning, and brand messaging",
  "Growth plans, campaigns, landing pages, and conversion journeys",
  "Automation, tool integrations, dashboards, and operating systems",
  "Independent review of projects, proposals, and plans before investment",
] as const;

export function AreasSection({ copy }: { copy: any }) {
  const isArabic = copy.eyebrow === "أين نساعد؟";
  const deliverables = isArabic ? DELIVERABLES_AR : DELIVERABLES_EN;

  return (
    <Section tone="floral" id="areas">
      <SectionHeading
        align="center"
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        className="mx-auto"
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {copy.items.map(([title, text]: readonly [string, string], i: number) => (
          <article
            key={title}
            className="group rounded-xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-camel/50 hover:shadow-lg"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-camel/10 font-display text-sm font-semibold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{text}</p>
            <div className="mt-5 border-t border-border/70 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {isArabic ? "ما الذي ننفّذه" : "What we deliver"}
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-ink/80">
                {deliverables[i]}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
