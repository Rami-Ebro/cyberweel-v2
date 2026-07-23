import Link from "next/link";
import { ArchGateway } from "@/components/brand/motif";

export const metadata = {
  title: "معاينة هوية الهيرو",
  robots: { index: false, follow: false },
};

function CircuitSide({ mirror = false }: { mirror?: boolean }) {
  const paths = [
    "M18 54 H96 L126 84 H204",
    "M18 90 H72 L106 124 H190",
    "M18 128 H118 L146 156 H220",
    "M18 166 H84 L120 202 H202",
    "M18 206 H110 L136 232 H226",
    "M18 246 H78 L112 280 H198",
    "M18 288 H124 L150 314 H232",
    "M18 332 H92 L128 368 H214",
    "M18 376 H116 L146 406 H224",
    "M18 422 H82 L118 458 H204",
  ];

  const nodes = [
    [96, 54], [126, 84], [72, 90], [106, 124], [118, 128],
    [146, 156], [84, 166], [120, 202], [110, 206], [136, 232],
    [78, 246], [112, 280], [124, 288], [150, 314], [92, 332],
    [128, 368], [116, 376], [146, 406], [82, 422], [118, 458],
  ];

  return (
    <svg
      viewBox="0 0 250 520"
      className={`h-full w-full ${mirror ? "-scale-x-100" : ""}`}
      aria-hidden
    >
      <defs>
        <filter id="nodeGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="circuitStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D8D2C4" stopOpacity="0.12" />
          <stop offset="0.55" stopColor="#D8D2C4" stopOpacity="0.42" />
          <stop offset="1" stopColor="#B89A5A" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      {paths.map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke="url(#circuitStroke)"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {nodes.map(([cx, cy], index) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="6" fill="#2563EB" opacity={index % 3 === 0 ? 0.42 : 0.2} filter="url(#nodeGlow)" />
          <circle cx={cx} cy={cy} r="1.7" fill="#93C5FD" opacity="0.95" />
        </g>
      ))}

      {Array.from({ length: 70 }).map((_, index) => {
        const x = 18 + ((index * 37) % 210);
        const y = 26 + ((index * 53) % 460);
        return <circle key={index} cx={x} cy={y} r="0.75" fill="#D8D2C4" opacity="0.13" />;
      })}
    </svg>
  );
}

function FloorGrid() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] overflow-hidden opacity-55">
      <div
        className="absolute inset-x-[-20%] bottom-[-45%] h-[180%]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.18) 1px, transparent 1px)",
          backgroundSize: "52px 36px",
          transform: "perspective(420px) rotateX(66deg)",
          transformOrigin: "center bottom",
          maskImage: "linear-gradient(to top, black 25%, transparent 92%)",
        }}
      />
      <div className="absolute inset-x-[24%] bottom-[2%] h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,.9),transparent)] shadow-[0_0_18px_rgba(37,99,235,.75)]" />
    </div>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-floral">
      <section className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_52%_36%,rgba(28,43,68,.52),transparent_38%),linear-gradient(135deg,#03060B_0%,#0A1220_48%,#050911_100%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(216,210,196,.12)_1px,transparent_0)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

        <div aria-hidden className="pointer-events-none absolute inset-y-[6%] left-0 w-[31%] opacity-85">
          <CircuitSide />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-[6%] right-0 w-[31%] opacity-85">
          <CircuitSide mirror />
        </div>

        <FloorGrid />

        <div className="cw-container relative z-10 flex min-h-screen flex-col py-8 sm:py-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold tracking-[0.28em] text-camel uppercase">CyberWeel Identity Preview</p>
            <Link
              href="/"
              className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-floral/20 bg-black/15 px-4 text-sm font-semibold text-floral transition hover:border-camel/50 hover:bg-camel/10"
            >
              العودة إلى الرئيسية
            </Link>
          </div>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
            <div className="relative mx-auto hidden h-[590px] w-[590px] max-w-full lg:block">
              <div aria-hidden className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.12),transparent_64%)] blur-xl" />
              <ArchGateway className="absolute inset-0 [&_path]:stroke-[#334155]" />
              <div aria-hidden className="absolute left-1/2 top-[3%] h-[38%] w-16 -translate-x-1/2 bg-[linear-gradient(to_bottom,rgba(184,154,90,.62),rgba(37,99,235,.14),transparent)] blur-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/logo-transparent.png"
                  alt="CyberWeel"
                  className="relative z-10 h-[245px] w-[245px] object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,.55)]"
                />
              </div>
              <div className="absolute bottom-[8%] left-1/2 h-px w-[70%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(37,99,235,.95),transparent)] shadow-[0_0_22px_rgba(37,99,235,.8)]" />
            </div>

            <div className="justify-self-end text-right" dir="rtl">
              <p className="text-sm font-bold tracking-[0.12em] text-camel">سايبر ويل</p>
              <h1 className="mt-5 max-w-3xl font-display text-[2.5rem] font-light leading-[1.2] tracking-tight text-floral sm:text-6xl lg:text-[4.6rem]">
                من حيث أنت…
                <span className="mt-2 block text-camel">إلى حيث تريد أن تكون</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-semibold leading-9 text-bone sm:text-xl">
                نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال بثقة إلى المرحلة التالية
              </p>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-bone/75 sm:text-lg">
                الخلفية هنا تستخدم نفس لغة بطاقة الأعمال: مسارات إلكترونية جانبية، نقاط ضوئية زرقاء، وقوس الهوية بحجر الارتكاز الذهبي
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
