import Link from "next/link";

export const metadata = {
  title: "معاينة خلفية الهيرو",
  robots: { index: false, follow: false },
};

const steps = [
  ["نفهم التحدي", "نستمع بعمق لفهم ما يعيق التقدّم فعليًا."],
  ["نحلل الوضع", "نرتب المعطيات ونميز بين الضجيج والمشكلة الحقيقية."],
  ["نصمم الحل", "نحدد الخطوة العملية التالية، لا الخطوة الأجمل شكليًا."],
  ["نحقق الأثر", "ننتقل من القرار إلى التنفيذ بثقة ووضوح."],
];

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="cw-container py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow-camel">Preview</p>
            <h1 className="mt-2 font-display text-3xl font-light text-ink sm:text-4xl">معاينة خلفية الهيرو</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              تجربة منفصلة ومبنية بالكود لخلفية هادئة مستوحاة من بطاقة الأعمال، من دون تعديل الهيرو الحقيقي.
            </p>
          </div>
          <Link href="/" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold text-ink transition hover:bg-bone/30">
            العودة إلى الرئيسية
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-white shadow-sm">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(247,243,235,.95))" }} />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(70% 60% at 82% 12%, rgba(184,154,90,.10), transparent 65%), radial-gradient(55% 40% at 18% 88%, rgba(143,168,192,.10), transparent 72%)" }} />
          <div aria-hidden className="pointer-events-none absolute -left-[14%] bottom-[-10%] h-[70%] w-[64%] rounded-[999px] border border-[#d9e4ee] opacity-90" style={{ transform: "rotate(-14deg)" }} />
          <div aria-hidden className="pointer-events-none absolute -left-[10%] bottom-[-18%] h-[72%] w-[70%] rounded-[999px] border border-[#eadfca] opacity-80" style={{ transform: "rotate(-8deg)" }} />
          <div aria-hidden className="pointer-events-none absolute left-[10%] bottom-[12%] h-[22rem] w-[28rem] rounded-[999px] bg-[linear-gradient(135deg,rgba(224,234,243,.28),rgba(255,255,255,.02))] blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute bottom-[20%] left-[5%] h-px w-[38%] bg-[linear-gradient(90deg,transparent,rgba(184,154,90,.55),transparent)]" />
          <div aria-hidden className="pointer-events-none absolute bottom-[26%] left-[12%] h-px w-[26%] bg-[linear-gradient(90deg,transparent,rgba(216,210,196,.85),transparent)]" />

          <div className="relative grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[.92fr_1.08fr] lg:px-14 lg:py-16">
            <aside className="max-w-md rounded-[1.5rem] border border-white/80 bg-white/72 p-6 shadow-[0_16px_40px_rgba(17,24,39,.06)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-light text-ink">منهجنا في 4 خطوات</h2>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-camel/35 text-accent">✦</span>
              </div>
              <div className="mt-6 space-y-5">
                {steps.map(([title, text], index) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-camel/35 bg-white text-sm font-semibold text-ink">{String(index + 1).padStart(2, "0")}</span>
                      {index < 3 ? <span className="mt-2 h-8 w-px bg-border" /> : null}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-base font-semibold text-ink">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex items-center">
              <div className="max-w-2xl lg:pr-10">
                <p className="eyebrow-camel">خلفية تجريبية للهيرو</p>
                <h2 className="mt-5 font-display text-[2.35rem] font-light leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-[4.15rem]">
                  من حيث أنت...
                  <span className="mt-2 block text-accent">إلى حيث تريد أن تكون</span>
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  خطوط منحنية خفيفة، لمسات ذهبية دقيقة، وطبقات شبه شفافة تمنح الهيرو حضورًا أرقى من دون أن تزاحم الرسالة.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button className="inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 text-base font-semibold text-floral">ابدأ محادثة الآن</button>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-md border border-camel/50 bg-white/80 px-6 text-base font-semibold text-ink">شاركنا مشكلتك</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
