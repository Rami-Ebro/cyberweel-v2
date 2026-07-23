import Link from "next/link";
import { ArchGateway } from "@/components/brand/motif";

export const metadata = {
  title: "معاينة خلفية الهيرو",
  robots: { index: false, follow: false },
};

function CircuitBackground() {
  const leftPaths = [
    "M0 90 H150 L190 130 H360",
    "M0 155 H110 L160 205 H330",
    "M0 230 H175 L215 270 H390",
    "M0 315 H120 L170 365 H350",
    "M0 405 H160 L205 450 H380",
    "M0 500 H115 L165 550 H340",
    "M0 600 H170 L220 650 H400",
  ];

  const nodes = [
    [150, 90], [190, 130], [110, 155], [160, 205], [175, 230], [215, 270],
    [120, 315], [170, 365], [160, 405], [205, 450], [115, 500], [165, 550],
    [170, 600], [220, 650],
  ];

  return (
    <svg viewBox="0 0 1600 820" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <defs>
        <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g fill="none" stroke="#D8D2C4" strokeOpacity="0.16" strokeWidth="1.1">
        {leftPaths.map((d) => <path key={d} d={d} />)}
      </g>
      <g transform="translate(1600 0) scale(-1 1)" fill="none" stroke="#D8D2C4" strokeOpacity="0.16" strokeWidth="1.1">
        {leftPaths.map((d) => <path key={d} d={d} />)}
      </g>

      <g>
        {nodes.map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="7" fill="#2563EB" opacity={index % 3 === 0 ? 0.28 : 0.17} filter="url(#glow)" />
            <circle cx={cx} cy={cy} r="1.8" fill="#93C5FD" opacity="0.9" />
            <circle cx={1600 - cx} cy={cy} r="7" fill="#2563EB" opacity={index % 3 === 0 ? 0.28 : 0.17} filter="url(#glow)" />
            <circle cx={1600 - cx} cy={cy} r="1.8" fill="#93C5FD" opacity="0.9" />
          </g>
        ))}
      </g>

      {Array.from({ length: 100 }).map((_, index) => {
        const x = (index * 157) % 1600;
        const y = (index * 83) % 760;
        return <circle key={index} cx={x} cy={y} r="0.7" fill="#D8D2C4" opacity="0.08" />;
      })}
    </svg>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#070B12] text-floral">
      <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_32%_45%,rgba(28,43,68,.40),transparent_34%),linear-gradient(135deg,#050912_0%,#0B1423_52%,#050911_100%)]">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <CircuitBackground />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] overflow-hidden opacity-30">
          <div
            className="absolute inset-x-[-15%] bottom-[-52%] h-[190%]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(37,99,235,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.15) 1px, transparent 1px)",
              backgroundSize: "58px 38px",
              transform: "perspective(430px) rotateX(67deg)",
              transformOrigin: "center bottom",
              maskImage: "linear-gradient(to top, black 20%, transparent 90%)",
            }}
          />
        </div>

        <div className="cw-container relative z-10 flex min-h-screen flex-col py-7 sm:py-9">
          <div className="flex justify-end">
            <Link href="/" className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-floral/20 bg-black/15 px-4 text-sm font-semibold text-floral transition hover:border-camel/50 hover:bg-camel/10">
              العودة إلى الرئيسية
            </Link>
          </div>

          <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.05fr_.95fr] lg:py-12">
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

            <div className="relative mx-auto hidden h-[560px] w-[560px] max-w-full lg:block">
              <div aria-hidden className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,.12),transparent_66%)] blur-xl" />
              <ArchGateway className="absolute inset-0 [&_path]:stroke-[#334155]" />
              <div aria-hidden className="absolute left-1/2 top-[3%] h-[38%] w-14 -translate-x-1/2 bg-[linear-gradient(to_bottom,rgba(184,154,90,.50),rgba(37,99,235,.10),transparent)] blur-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/logo-transparent.png" alt="CyberWeel" className="relative z-10 h-[235px] w-[235px] object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,.55)]" />
              </div>
              <div className="absolute bottom-[7%] left-1/2 h-px w-[68%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(37,99,235,.85),transparent)] shadow-[0_0_20px_rgba(37,99,235,.65)]" />
              <p className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-bold text-bone/80" dir="rtl">
                وضوح ← قرار ← تنفيذ ← تقدّم
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
