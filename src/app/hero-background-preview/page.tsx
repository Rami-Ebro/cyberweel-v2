export const metadata = {
  title: "Hero Arch Preview | CyberWeel",
  robots: { index: false, follow: false },
};

function ArchCircuitDetails() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 620 640"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id="haloGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b89a5a" stopOpacity="0.18" />
          <stop offset="48%" stopColor="#b89a5a" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#b89a5a" stopOpacity="0.12" />
        </linearGradient>
        <filter id="haloDotGlow" x="-260%" y="-260%" width="620%" height="620%">
          <feGaussianBlur stdDeviation="2.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        fill="none"
        stroke="url(#haloGold)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.15"
      >
        <path d="M248 116 C156 137 93 230 84 338 C79 409 95 477 132 531" />
        <path d="M372 116 C464 137 527 230 536 338 C541 409 525 477 488 531" />

        <path d="M217 143 L181 130 H118" />
        <path d="M177 169 L141 154 H78" />
        <path d="M143 205 L111 192 H52" />
        <path d="M116 246 L84 238 H30" />
        <path d="M98 292 L67 288 H22" />
        <path d="M88 342 H46 L26 329" />
        <path d="M89 391 H48 L26 406" />
        <path d="M99 440 H61 L39 462" />
        <path d="M115 481 H82 L60 510" />

        <path d="M403 143 L439 130 H502" />
        <path d="M443 169 L479 154 H542" />
        <path d="M477 205 L509 192 H568" />
        <path d="M504 246 L536 238 H590" />
        <path d="M522 292 L553 288 H598" />
        <path d="M532 342 H574 L594 329" />
        <path d="M531 391 H572 L594 406" />
        <path d="M521 440 H559 L581 462" />
        <path d="M505 481 H538 L560 510" />
      </g>

      <g fill="#d8d2c4" opacity="0.42">
        <circle cx="217" cy="143" r="1.6" /><circle cx="181" cy="130" r="1.4" />
        <circle cx="177" cy="169" r="1.5" /><circle cx="141" cy="154" r="1.4" />
        <circle cx="143" cy="205" r="1.6" /><circle cx="111" cy="192" r="1.4" />
        <circle cx="116" cy="246" r="1.5" /><circle cx="84" cy="238" r="1.4" />
        <circle cx="98" cy="292" r="1.6" /><circle cx="67" cy="288" r="1.4" />
        <circle cx="88" cy="342" r="1.5" /><circle cx="46" cy="342" r="1.4" />
        <circle cx="89" cy="391" r="1.6" /><circle cx="48" cy="391" r="1.4" />
        <circle cx="99" cy="440" r="1.5" /><circle cx="61" cy="440" r="1.4" />
        <circle cx="115" cy="481" r="1.6" /><circle cx="82" cy="481" r="1.4" />

        <circle cx="403" cy="143" r="1.6" /><circle cx="439" cy="130" r="1.4" />
        <circle cx="443" cy="169" r="1.5" /><circle cx="479" cy="154" r="1.4" />
        <circle cx="477" cy="205" r="1.6" /><circle cx="509" cy="192" r="1.4" />
        <circle cx="504" cy="246" r="1.5" /><circle cx="536" cy="238" r="1.4" />
        <circle cx="522" cy="292" r="1.6" /><circle cx="553" cy="288" r="1.4" />
        <circle cx="532" cy="342" r="1.5" /><circle cx="574" cy="342" r="1.4" />
        <circle cx="531" cy="391" r="1.6" /><circle cx="572" cy="391" r="1.4" />
        <circle cx="521" cy="440" r="1.5" /><circle cx="559" cy="440" r="1.4" />
        <circle cx="505" cy="481" r="1.6" /><circle cx="538" cy="481" r="1.4" />
      </g>

      <g fill="#4b82ff" filter="url(#haloDotGlow)" opacity="0.72">
        <circle cx="248" cy="116" r="1.8" />
        <circle cx="177" cy="169" r="1.8" />
        <circle cx="116" cy="246" r="1.8" />
        <circle cx="88" cy="342" r="1.8" />
        <circle cx="99" cy="440" r="1.8" />
        <circle cx="132" cy="531" r="1.8" />

        <circle cx="372" cy="116" r="1.8" />
        <circle cx="443" cy="169" r="1.8" />
        <circle cx="504" cy="246" r="1.8" />
        <circle cx="532" cy="342" r="1.8" />
        <circle cx="521" cy="440" r="1.8" />
        <circle cx="488" cy="531" r="1.8" />
      </g>
    </svg>
  );
}

function HeroArchStage() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative h-[640px] w-[620px]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[292px] h-[420px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(160,208,255,0.08) 0%, rgba(122,184,255,0.045) 46%, rgba(122,184,255,0) 76%)" }} />

        <ArchCircuitDetails />

        <svg aria-hidden viewBox="0 0 220 390" className="pointer-events-none absolute left-1/2 top-[86px] h-[390px] w-[220px] -translate-x-1/2 overflow-visible">
          <defs>
            <linearGradient id="mistBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff9e8" stopOpacity="0.58" />
              <stop offset="15%" stopColor="#e8f4ff" stopOpacity="0.50" />
              <stop offset="52%" stopColor="#abd7ff" stopOpacity="0.30" />
              <stop offset="82%" stopColor="#80bcf5" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#80bcf5" stopOpacity="0" />
            </linearGradient>
            <filter id="mistFilter" x="-70%" y="-20%" width="240%" height="150%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="2" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="B" />
              <feGaussianBlur stdDeviation="13" />
            </filter>
            <filter id="mistCore" x="-80%" y="-20%" width="260%" height="150%">
              <feTurbulence type="fractalNoise" baseFrequency="0.016 0.052" numOctaves="2" seed="11" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <path d="M108 0 C87 52 74 108 76 166 C78 226 89 282 110 365 C131 282 142 226 144 166 C146 108 133 52 112 0 Z" fill="url(#mistBeam)" filter="url(#mistFilter)" opacity="0.92" />
          <path d="M109 0 C99 64 96 118 98 174 C100 230 103 278 110 342 C117 278 120 230 122 174 C124 118 121 64 111 0 Z" fill="url(#mistBeam)" filter="url(#mistCore)" opacity="0.82" />
        </svg>

        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[91px] h-16 w-16 -translate-x-1/2 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,248,226,0.35) 0%, rgba(218,235,255,0.18) 46%, transparent 76%)" }} />

        <img src="/cyberweel-logo-20260720.svg" alt="" className="absolute left-1/2 top-1/2 h-auto w-full max-w-[590px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.35)]" />
      </div>

      <p dir="rtl" className="mt-2 text-center text-xl font-bold tracking-[0.04em] text-[#d8d2c4]/72 sm:text-2xl">
        وضوح ← قرار ← تنفيذ ← تقدّم
      </p>
    </div>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#070b13] text-[#f7f3eb]">
      <section className="relative min-h-screen overflow-hidden">
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 80% at 18% 50%, rgba(38,58,88,0.28), transparent 70%), linear-gradient(110deg, #070b13 0%, #0b111d 45%, #111827 72%, #080c14 100%)" }} />

        <div dir="ltr" className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="relative hidden min-h-[620px] items-center justify-center lg:flex">
            <HeroArchStage />
          </div>

          <div className="max-w-2xl justify-self-end text-right" dir="rtl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#b89a5a] sm:text-base">سايبر ويل</p>

            <h1 className="mt-7 font-display text-5xl font-light leading-[1.12] tracking-tight text-[#f7f3eb] sm:text-6xl lg:text-7xl">
              <span className="block">من حيث أنت…</span>
              <span className="mt-3 block text-[#b89a5a]">إلى حيث تريد أن تكون</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg font-semibold leading-9 text-[#d8d2c4]/90 sm:text-xl">
              نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال بثقة إلى المرحلة التالية.
            </p>

            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-[#d8d2c4]/70 sm:text-lg">
              حلول رقمية وأمن سيبراني تبدأ بفهم المشكلة، ثم تحديد الخطوة الصحيحة، ثم تنفيذ ما يحتاجه عملك فعلًا.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-start">
              <a href="#" className="inline-flex min-h-14 items-center justify-center rounded-md bg-[#b89a5a] px-7 text-base font-bold text-[#111827] transition hover:bg-[#c6aa70]">ابدأ محادثة الآن</a>
              <a href="#" className="inline-flex min-h-14 items-center justify-center rounded-md border border-[#d8d2c4]/25 bg-white/[0.035] px-7 text-base font-bold text-[#f7f3eb] backdrop-blur-sm transition hover:border-[#b89a5a]/50 hover:bg-white/[0.06]">شاركنا مشكلتك</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
