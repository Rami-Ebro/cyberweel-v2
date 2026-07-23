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
        <linearGradient id="circuitFadeLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b89a5a" stopOpacity="0" />
          <stop offset="22%" stopColor="#b89a5a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#b89a5a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="circuitFadeRight" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#b89a5a" stopOpacity="0" />
          <stop offset="22%" stopColor="#b89a5a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#b89a5a" stopOpacity="0.5" />
        </linearGradient>
        <filter id="circuitDotGlow" x="-260%" y="-260%" width="620%" height="620%">
          <feGaussianBlur stdDeviation="2.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g fill="none" stroke="url(#circuitFadeLeft)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
        <path d="M18 174 H92 L128 202 H166" />
        <path d="M36 204 H105 L139 230 H181" />
        <path d="M12 238 H94 L123 258 H171" />
        <path d="M34 270 H118 L145 288 H184" />
        <path d="M16 305 H108 L139 321 H181" />
        <path d="M28 342 H112 L143 342 H183" />
        <path d="M10 378 H102 L132 365 H176" />
        <path d="M34 414 H112 L142 392 H182" />
        <path d="M18 450 H91 L128 422 H170" />
        <path d="M42 482 H100 L136 449 H166" />
      </g>

      <g fill="none" stroke="url(#circuitFadeRight)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1">
        <path d="M602 174 H528 L492 202 H454" />
        <path d="M584 204 H515 L481 230 H439" />
        <path d="M608 238 H526 L497 258 H449" />
        <path d="M586 270 H502 L475 288 H436" />
        <path d="M604 305 H512 L481 321 H439" />
        <path d="M592 342 H508 L477 342 H437" />
        <path d="M610 378 H518 L488 365 H444" />
        <path d="M586 414 H508 L478 392 H438" />
        <path d="M602 450 H529 L492 422 H450" />
        <path d="M578 482 H520 L484 449 H454" />
      </g>

      <g fill="#d8d2c4" opacity="0.34">
        <circle cx="92" cy="174" r="1.7" /><circle cx="128" cy="202" r="1.5" />
        <circle cx="105" cy="204" r="1.5" /><circle cx="139" cy="230" r="1.7" />
        <circle cx="94" cy="238" r="1.4" /><circle cx="123" cy="258" r="1.5" />
        <circle cx="118" cy="270" r="1.7" /><circle cx="145" cy="288" r="1.4" />
        <circle cx="108" cy="305" r="1.5" /><circle cx="139" cy="321" r="1.7" />
        <circle cx="112" cy="342" r="1.5" /><circle cx="143" cy="342" r="1.4" />
        <circle cx="102" cy="378" r="1.7" /><circle cx="132" cy="365" r="1.5" />
        <circle cx="112" cy="414" r="1.4" /><circle cx="142" cy="392" r="1.7" />
        <circle cx="91" cy="450" r="1.5" /><circle cx="128" cy="422" r="1.4" />
        <circle cx="100" cy="482" r="1.6" /><circle cx="136" cy="449" r="1.5" />

        <circle cx="528" cy="174" r="1.7" /><circle cx="492" cy="202" r="1.5" />
        <circle cx="515" cy="204" r="1.5" /><circle cx="481" cy="230" r="1.7" />
        <circle cx="526" cy="238" r="1.4" /><circle cx="497" cy="258" r="1.5" />
        <circle cx="502" cy="270" r="1.7" /><circle cx="475" cy="288" r="1.4" />
        <circle cx="512" cy="305" r="1.5" /><circle cx="481" cy="321" r="1.7" />
        <circle cx="508" cy="342" r="1.5" /><circle cx="477" cy="342" r="1.4" />
        <circle cx="518" cy="378" r="1.7" /><circle cx="488" cy="365" r="1.5" />
        <circle cx="508" cy="414" r="1.4" /><circle cx="478" cy="392" r="1.7" />
        <circle cx="529" cy="450" r="1.5" /><circle cx="492" cy="422" r="1.4" />
        <circle cx="520" cy="482" r="1.6" /><circle cx="484" cy="449" r="1.5" />
      </g>

      <g fill="#4b82ff" filter="url(#circuitDotGlow)" opacity="0.68">
        <circle cx="166" cy="202" r="1.8" /><circle cx="181" cy="230" r="1.6" />
        <circle cx="171" cy="258" r="1.7" /><circle cx="184" cy="288" r="1.5" />
        <circle cx="181" cy="321" r="1.8" /><circle cx="183" cy="342" r="1.5" />
        <circle cx="176" cy="365" r="1.7" /><circle cx="182" cy="392" r="1.6" />
        <circle cx="170" cy="422" r="1.8" /><circle cx="166" cy="449" r="1.5" />

        <circle cx="454" cy="202" r="1.8" /><circle cx="439" cy="230" r="1.6" />
        <circle cx="449" cy="258" r="1.7" /><circle cx="436" cy="288" r="1.5" />
        <circle cx="439" cy="321" r="1.8" /><circle cx="437" cy="342" r="1.5" />
        <circle cx="444" cy="365" r="1.7" /><circle cx="438" cy="392" r="1.6" />
        <circle cx="450" cy="422" r="1.8" /><circle cx="454" cy="449" r="1.5" />
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
