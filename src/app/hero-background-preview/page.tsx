export const metadata = {
  title: "Hero Arch Preview | CyberWeel",
  robots: { index: false, follow: false },
};

function ArchWaterBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[318px] z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(74,126,187,0.18) 0%, rgba(52,91,143,0.11) 34%, rgba(20,40,70,0.05) 58%, transparent 76%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[118px] z-0 h-36 w-36 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(184,154,90,0.22) 0%, rgba(184,154,90,0.09) 38%, transparent 72%)",
        }}
      />

      <svg
        aria-hidden
        viewBox="0 0 620 640"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="waterRing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c7e2ff" stopOpacity="0.08" />
            <stop offset="48%" stopColor="#7eb8ee" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#4a79aa" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="waterWave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8ec8ff" stopOpacity="0" />
            <stop offset="22%" stopColor="#8ec8ff" stopOpacity="0.07" />
            <stop offset="50%" stopColor="#d9ecff" stopOpacity="0.10" />
            <stop offset="78%" stopColor="#8ec8ff" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#8ec8ff" stopOpacity="0" />
          </linearGradient>
          <filter id="softWater" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <ellipse cx="310" cy="326" rx="254" ry="252" fill="none" stroke="url(#waterRing)" strokeWidth="1.1" opacity="0.46" />
        <ellipse cx="310" cy="326" rx="226" ry="224" fill="none" stroke="url(#waterRing)" strokeWidth="0.9" opacity="0.34" />
        <ellipse cx="310" cy="326" rx="196" ry="194" fill="none" stroke="url(#waterRing)" strokeWidth="0.7" opacity="0.20" />

        <path d="M74 246 C158 207 226 274 310 236 C394 198 470 210 546 242" fill="none" stroke="url(#waterWave)" strokeWidth="0.95" filter="url(#softWater)" opacity="0.72" />
        <path d="M56 310 C145 268 226 340 310 302 C394 264 480 270 565 306" fill="none" stroke="url(#waterWave)" strokeWidth="0.85" filter="url(#softWater)" opacity="0.56" />
        <path d="M68 380 C153 342 232 410 310 372 C388 334 468 344 552 376" fill="none" stroke="url(#waterWave)" strokeWidth="0.8" filter="url(#softWater)" opacity="0.42" />
        <path d="M101 448 C174 417 238 474 310 442 C382 410 447 419 519 445" fill="none" stroke="url(#waterWave)" strokeWidth="0.7" filter="url(#softWater)" opacity="0.28" />
      </svg>
    </>
  );
}

function HeroArchStage() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative h-[640px] w-[620px]">
        <ArchWaterBackdrop />

        <svg aria-hidden viewBox="0 0 220 390" className="pointer-events-none absolute left-1/2 top-[86px] z-[2] h-[390px] w-[220px] -translate-x-1/2 overflow-visible">
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

        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[91px] z-[3] h-16 w-16 -translate-x-1/2 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,248,226,0.35) 0%, rgba(218,235,255,0.18) 46%, transparent 76%)" }} />

        <img src="/cyberweel-logo-20260720.svg" alt="" className="absolute left-1/2 top-1/2 z-10 h-auto w-full max-w-[590px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.35)]" />
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
