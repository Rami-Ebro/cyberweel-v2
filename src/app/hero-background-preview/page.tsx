export const metadata = {
  title: "Hero Arch Preview | CyberWeel",
  robots: { index: false, follow: false },
};

function TechnicalHalo() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 760 640"
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[640px] w-[760px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
    >
      <defs>
        <linearGradient id="trace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b89a5a" stopOpacity="0" />
          <stop offset="45%" stopColor="#b89a5a" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0.16" />
        </linearGradient>
        <filter id="traceGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <g fill="none" stroke="url(#trace)" strokeWidth="1.15" opacity="0.78">
        <path d="M28 174 H132 L168 210 H214" />
        <path d="M18 214 H104 L145 255 H202" />
        <path d="M42 258 H118 L154 294 H196" />
        <path d="M22 314 H118 L151 347 H194" />
        <path d="M34 374 H132 L164 342 H204" />
        <path d="M64 432 H144 L178 398 H214" />

        <path d="M732 174 H628 L592 210 H546" />
        <path d="M742 214 H656 L615 255 H558" />
        <path d="M718 258 H642 L606 294 H564" />
        <path d="M738 314 H642 L609 347 H566" />
        <path d="M726 374 H628 L596 342 H556" />
        <path d="M696 432 H616 L582 398 H546" />
      </g>

      <g fill="#b89a5a" opacity="0.72" filter="url(#traceGlow)">
        <circle cx="132" cy="174" r="3.2" />
        <circle cx="145" cy="255" r="2.8" />
        <circle cx="151" cy="347" r="2.8" />
        <circle cx="178" cy="398" r="2.5" />
        <circle cx="628" cy="174" r="3.2" />
        <circle cx="615" cy="255" r="2.8" />
        <circle cx="609" cy="347" r="2.8" />
        <circle cx="582" cy="398" r="2.5" />
      </g>

      <g fill="#111827" opacity="0.2">
        <circle cx="214" cy="210" r="2" />
        <circle cx="202" cy="255" r="2" />
        <circle cx="196" cy="294" r="2" />
        <circle cx="194" cy="347" r="2" />
        <circle cx="546" cy="210" r="2" />
        <circle cx="558" cy="255" r="2" />
        <circle cx="564" cy="294" r="2" />
        <circle cx="566" cy="347" r="2" />
      </g>
    </svg>
  );
}

function LightBeam() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 180 430"
      className="pointer-events-none absolute left-1/2 top-[76px] z-[6] h-[430px] w-[180px] -translate-x-1/2 overflow-visible"
    >
      <defs>
        <linearGradient id="beamFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="54%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="82%" stopColor="#f7f3eb" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#f7f3eb" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beamEdge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d2c4" stopOpacity="0.8" />
          <stop offset="62%" stopColor="#d8d2c4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#d8d2c4" stopOpacity="0" />
        </linearGradient>
        <filter id="beamGlow" x="-120%" y="-20%" width="340%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="beamCore" x="-100%" y="-20%" width="300%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <path
        d="M72 0 C68 56 64 116 60 174 C56 236 50 300 42 370 C58 360 74 355 90 355 C106 355 122 360 138 370 C130 300 124 236 120 174 C116 116 112 56 108 0 Z"
        fill="url(#beamEdge)"
        filter="url(#beamGlow)"
        opacity="0.7"
      />
      <path
        d="M77 0 C74 58 72 118 70 180 C68 240 65 294 61 340 C70 334 80 331 90 331 C100 331 110 334 119 340 C115 294 112 240 110 180 C108 118 106 58 103 0 Z"
        fill="url(#beamFill)"
        filter="url(#beamCore)"
        opacity="0.98"
      />
    </svg>
  );
}

function HeroArchStage() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative h-[640px] w-[620px]">
        <TechnicalHalo />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[330px] z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(247,243,235,0.96) 0%, rgba(216,210,196,0.42) 48%, rgba(184,154,90,0.08) 68%, transparent 82%)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[475px] z-[1] h-20 w-[470px] -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: "rgba(17,24,39,0.16)" }}
        />

        <img
          src="/cyberweel-logo-20260720.svg"
          alt=""
          aria-hidden
          className="absolute left-1/2 top-1/2 z-[2] h-auto w-full max-w-[590px] -translate-x-[48.8%] -translate-y-[48.5%] object-contain opacity-40 blur-[1px]"
          style={{ filter: "brightness(0.55) saturate(0.8)" }}
        />

        <LightBeam />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[83px] z-[7] h-20 w-20 -translate-x-1/2 rounded-full blur-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(247,243,235,0.82) 42%, rgba(184,154,90,0.24) 66%, transparent 84%)",
          }}
        />

        <img
          src="/cyberweel-logo-20260720.svg"
          alt=""
          className="absolute left-1/2 top-1/2 z-10 h-auto w-full max-w-[590px] -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{
            filter:
              "drop-shadow(0 3px 0 rgba(255,255,255,0.42)) drop-shadow(0 10px 12px rgba(17,24,39,0.2)) drop-shadow(0 22px 32px rgba(17,24,39,0.14))",
          }}
        />
      </div>

      <p dir="rtl" className="mt-2 text-center text-xl font-bold tracking-[0.04em] text-[#111827]/72 sm:text-2xl">
        وضوح ← قرار ← تنفيذ ← تقدّم
      </p>
    </div>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#ece7da] text-[#111827]">
      <section className="relative min-h-screen overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 78% at 20% 48%, rgba(247,243,235,0.94), transparent 66%), radial-gradient(42% 58% at 77% 26%, rgba(216,210,196,0.38), transparent 70%), linear-gradient(128deg, #f7f3eb 0%, #ece7da 46%, #d8d2c4 100%)",
          }}
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#d8d2c4]/35 to-transparent" />

        <div dir="ltr" className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="relative hidden min-h-[620px] items-center justify-center lg:flex">
            <HeroArchStage />
          </div>

          <div className="max-w-2xl justify-self-end text-right" dir="rtl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#b89a5a] sm:text-base">سايبر ويل</p>

            <h1 className="mt-7 font-display text-5xl font-light leading-[1.12] tracking-tight text-[#111827] sm:text-6xl lg:text-7xl">
              <span className="block">من حيث أنت…</span>
              <span className="mt-3 block text-[#b89a5a]">إلى حيث تريد أن تكون</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg font-semibold leading-9 text-[#111827]/86 sm:text-xl">
              نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال بثقة إلى المرحلة التالية.
            </p>

            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-[#111827]/66 sm:text-lg">
              حلول رقمية وأمن سيبراني تبدأ بفهم المشكلة، ثم تحديد الخطوة الصحيحة، ثم تنفيذ ما يحتاجه عملك فعلًا.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-start">
              <a href="#" className="inline-flex min-h-14 items-center justify-center rounded-md bg-[#b89a5a] px-7 text-base font-bold text-[#111827] shadow-[0_12px_30px_rgba(17,24,39,0.14)] transition hover:bg-[#c6aa70]">ابدأ محادثة الآن</a>
              <a href="#" className="inline-flex min-h-14 items-center justify-center rounded-md border border-[#111827]/18 bg-white/25 px-7 text-base font-bold text-[#111827] backdrop-blur-sm transition hover:border-[#b89a5a]/55 hover:bg-white/40">شاركنا مشكلتك</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
