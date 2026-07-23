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
          <stop offset="46%" stopColor="#b89a5a" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#b89a5a" stopOpacity="0.16" />
        </linearGradient>
        <filter id="haloDotGlow" x="-260%" y="-260%" width="620%" height="620%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g fill="none" stroke="url(#haloGold)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M244 111 C154 135 91 225 82 335 C76 414 96 488 137 541" strokeWidth="1.15" />
        <path d="M376 111 C466 135 529 225 538 335 C544 414 524 488 483 541" strokeWidth="1.15" />
        <path d="M226 128 C145 157 100 240 96 337 C92 405 109 466 145 515" strokeWidth="0.8" opacity="0.48" />
        <path d="M394 128 C475 157 520 240 524 337 C528 405 511 466 475 515" strokeWidth="0.8" opacity="0.48" />

        <path d="M213 139 L187 128 L158 128" />
        <path d="M167 173 L143 158 L113 158" />
        <path d="M129 220 L104 208 L77 208" />
        <path d="M103 274 L80 267 L55 267" />
        <path d="M90 333 L66 333 L48 321" />
        <path d="M91 394 L67 394 L50 407" />
        <path d="M105 454 L82 463 L66 483" />
        <path d="M129 505 L111 521 L101 548" />
        <path d="M145 515 V560" />

        <path d="M407 139 L433 128 L462 128" />
        <path d="M453 173 L477 158 L507 158" />
        <path d="M491 220 L516 208 L543 208" />
        <path d="M517 274 L540 267 L565 267" />
        <path d="M530 333 L554 333 L572 321" />
        <path d="M529 394 L553 394 L570 407" />
        <path d="M515 454 L538 463 L554 483" />
        <path d="M491 505 L509 521 L519 548" />
        <path d="M475 515 V560" />
      </g>

      <g fill="#d8d2c4" opacity="0.42">
        <circle cx="213" cy="139" r="1.5" /><circle cx="187" cy="128" r="1.35" />
        <circle cx="167" cy="173" r="1.5" /><circle cx="143" cy="158" r="1.35" />
        <circle cx="129" cy="220" r="1.5" /><circle cx="104" cy="208" r="1.35" />
        <circle cx="103" cy="274" r="1.5" /><circle cx="80" cy="267" r="1.35" />
        <circle cx="90" cy="333" r="1.5" /><circle cx="66" cy="333" r="1.35" />
        <circle cx="91" cy="394" r="1.5" /><circle cx="67" cy="394" r="1.35" />
        <circle cx="105" cy="454" r="1.5" /><circle cx="82" cy="463" r="1.35" />
        <circle cx="129" cy="505" r="1.5" /><circle cx="111" cy="521" r="1.35" />
        <circle cx="145" cy="515" r="1.5" />

        <circle cx="407" cy="139" r="1.5" /><circle cx="433" cy="128" r="1.35" />
        <circle cx="453" cy="173" r="1.5" /><circle cx="477" cy="158" r="1.35" />
        <circle cx="491" cy="220" r="1.5" /><circle cx="516" cy="208" r="1.35" />
        <circle cx="517" cy="274" r="1.5" /><circle cx="540" cy="267" r="1.35" />
        <circle cx="530" cy="333" r="1.5" /><circle cx="554" cy="333" r="1.35" />
        <circle cx="529" cy="394" r="1.5" /><circle cx="553" cy="394" r="1.35" />
        <circle cx="515" cy="454" r="1.5" /><circle cx="538" cy="463" r="1.35" />
        <circle cx="491" cy="505" r="1.5" /><circle cx="509" cy="521" r="1.35" />
        <circle cx="475" cy="515" r="1.5" />
      </g>

      <g fill="#4b82ff" filter="url(#haloDotGlow)" opacity="0.72">
        <circle cx="244" cy="111" r="1.8" />
        <circle cx="167" cy="173" r="1.75" />
        <circle cx="103" cy="274" r="1.75" />
        <circle cx="90" cy="333" r="1.75" />
        <circle cx="105" cy="454" r="1.75" />
        <circle cx="137" cy="541" r="1.8" />
        <circle cx="145" cy="560" r="1.65" />

        <circle cx="376" cy="111" r="1.8" />
        <circle cx="453" cy="173" r="1.75" />
        <circle cx="517" cy="274" r="1.75" />
        <circle cx="530" cy="333" r="1.75" />
        <circle cx="515" cy="454" r="1.75" />
        <circle cx="483" cy="541" r="1.8" />
        <circle cx="475" cy="560" r="1.65" />
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
