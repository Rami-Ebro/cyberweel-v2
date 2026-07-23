import Link from "next/link";
import { ArchGateway } from "@/components/brand/motif";

export const metadata = {
  title: "معاينة خلفية الهيرو",
  robots: { index: false, follow: false },
};

// Approved reference composition: arch on the left, copy on the right.
function TransparentCircuitMotif() {
  const paths = [
    "M20 72 H130 L168 110 H330",
    "M20 138 H92 L142 188 H310",
    "M20 220 H154 L196 262 H350",
    "M20 310 H108 L158 360 H326",
    "M20 408 H146 L192 454 H342",
    "M20 510 H98 L148 560 H314",
  ];

  const nodes = [
    [130, 72], [168, 110], [92, 138], [142, 188], [154, 220], [196, 262],
    [108, 310], [158, 360], [146, 408], [192, 454], [98, 510], [148, 560],
  ];

  return (
    <svg viewBox="0 0 380 640" className="h-full w-full" aria-hidden>
      <defs>
        <filter id="softGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g fill="none" stroke="#D8D2C4" strokeOpacity="0.12" strokeWidth="1">
        {paths.map((d) => <path key={d} d={d} />)}
      </g>

      {nodes.map(([cx, cy], index) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="6" fill="#2563EB" opacity={index % 3 === 0 ? 0.14 : 0.08} filter="url(#softGlow)" />
          <circle cx={cx} cy={cy} r="1.5" fill="#93C5FD" opacity="0.42" />
        </g>
      ))}
    </svg>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-floral">
      <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_28%_42%,rgba(28,43,68,.34),transparent_34%),linear-gradient(135deg,#050912_0%,#0B1423_52%,#050911_100%)]">
        <div className="cw-container relative z-10 flex min-h-screen flex-col py-7 sm:py-9">
          <div className="flex justify-end">
            <Link href="/" className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-floral/20 bg-black/15 px-4 text-sm font-semibold text-floral transition hover:border-camel/50 hover:bg-camel/10">
              العودة إلى الرئيسية
            </Link>
          </div>

          <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
            <div className="relative mx-auto hidden h-[560px] w-[560px] max-w-full lg:block">
              <div aria-hidden className="pointer-events-none absolute inset-y-[5%] left-[-14%] w-[56%] opacity-80">
                <TransparentCircuitMotif />
              </div>
              <div aria-hidden className="pointer-events-none absolute inset-y-[5%] right-[-14%] w-[56%] -scale-x-100 opacity-80">
                <TransparentCircuitMotif />
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 42%, rgba(184,154,90,0.22), rgba(184,154,90,0.08) 38%, transparent 62%)",
                }}
              />

              <div
                aria-hidden
                className="pointer-events-none absolute inset-[14%] rounded-[50%] rounded-b-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(17,24,39,0.05) 0%, rgba(184,154,90,0.06) 70%, rgba(17,24,39,0.02) 100%)",
                }}
              />

              <ArchGateway className="absolute inset-0" />

              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/logo-transparent.png"
                  alt="CyberWeel"
                  className="relative z-10 h-[260px] w-[260px] object-contain drop-shadow-[0_8px_24px_rgba(17,24,39,0.18)]"
                />
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span className="whitespace-nowrap text-sm font-medium tracking-[0.32em] text-bone/70 uppercase">
                  CyberWeel
                </span>
              </div>
            </div>

            <div className="justify-self-end text-right" dir="rtl">
              <p className="text-sm font-bold text-camel">سايبر ويل</p>
              <h1 className="mt-5 max-w-3xl font-display text-[2.55rem] font-light leading-[1.18] tracking-tight text-floral sm:text-6xl lg:text-[4.65rem]">
                من حيث أنت…
                <span className="mt-2 block text-camel">إلى حيث تريد أن تكون</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-semibold leading-9 text-bone sm:text-xl">
                نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال بثقة إلى المرحلة التالية
              </p>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-bone/75 sm:text-lg">
                حلول رقمية وأمن سيبراني تبدأ بفهم المشكلة، ثم تحديد الخطوة الصحيحة، ثم تنفيذ ما يحتاجه عملك فعلًا
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-start">
                <button className="inline-flex min-h-12 items-center justify-center rounded-md bg-camel px-7 text-base font-bold text-ink transition hover:bg-camel/90">
                  ابدأ محادثة الآن
                </button>
                <button className="inline-flex min-h-12 items-center justify-center rounded-md border border-bone/30 bg-black/15 px-7 text-base font-bold text-floral transition hover:border-camel/55 hover:bg-camel/10">
                  شاركنا مشكلتك
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
