export const metadata = {
  title: "Hero Arch Preview | CyberWeel",
  robots: { index: false, follow: false },
};

function ArchWaterBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[318px] z-0 h-[590px] w-[590px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(173,232,242,0.36) 0%, rgba(76,166,188,0.25) 38%, rgba(20,92,124,0.16) 62%, transparent 80%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[116px] z-0 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,244,204,0.50) 0%, rgba(184,154,90,0.20) 42%, transparent 76%)",
        }}
      />

      <svg aria-hidden viewBox="0 0 620 640" className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="waterRing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8f8ff" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#71c8d9" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1d7898" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="waterWave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dffaff" stopOpacity="0" />
            <stop offset="22%" stopColor="#bcecf4" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#e8fcff" stopOpacity="0.28" />
            <stop offset="78%" stopColor="#9bdbe8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#dffaff" stopOpacity="0" />
          </linearGradient>
          <filter id="softWater" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
        </defs>

        <ellipse cx="310" cy="326" rx="260" ry="258" fill="none" stroke="url(#waterRing)" strokeWidth="1.1" opacity="0.56" />
        <ellipse cx="310" cy="326" rx="232" ry="230" fill="none" stroke="url(#waterRing)" strokeWidth="0.9" opacity="0.38" />
        <ellipse cx="310" cy="326" rx="202" ry="200" fill="none" stroke="url(#waterRing)" strokeWidth="0.75" opacity="0.24" />

        <path d="M70 244 C158 201 226 279 310 236 C394 193 470 204 550 240" fill="none" stroke="url(#waterWave)" strokeWidth="1" filter="url(#softWater)" opacity="0.78" />
        <path d="M54 312 C144 263 226 347 310 302 C394 257 482 263 568 306" fill="none" stroke="url(#waterWave)" strokeWidth="0.9" filter="url(#softWater)" opacity="0.62" />
        <path d="M66 382 C153 337 232 417 310 372 C388 327 470 337 554 376" fill="none" stroke="url(#waterWave)" strokeWidth="0.8" filter="url(#softWater)" opacity="0.46" />
        <path d="M98 450 C174 413 238 480 310 442 C382 404 448 413 522 445" fill="none" stroke="url(#waterWave)" strokeWidth="0.7" filter="url(#softWater)" opacity="0.30" />
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
              <stop offset="0%" stopColor="#fff9e8" stopOpacity="0.66" />
              <stop offset="15%" stopColor="#edfaff" stopOpacity="0.54" />
              <stop offset="52%" stopColor="#bfe7f0" stopOpacity="0.34" />
              <stop offset="82%" stopColor="#7ec6d9" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#7ec6d9" stopOpacity="0" />
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
          <path d="M108 0 C87 52 74 108 76 166 C78 226 89 282 110 365 C131 282 142 226 144 166 C146 108 133 52 112 0 Z" fill="url(#mistBeam)" filter="url(#mistFilter)" opacity="0.94" />
          <path d="M109 0 C99 64 96 118 98 174 C100 230 103 278 110 342 C117 278 120 230 122 174 C124 118 121 64 111 0 Z" fill="url(#mistBeam)" filter="url(#mistCore)" opacity="0.84" />
        </svg>

        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[91px] z-[3] h-16 w-16 -translate-x-1/2 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,248,226,0.48) 0%, rgba(231,249,255,0.22) 46%, transparent 76%)" }} />

        <img src="/cyberweel-logo-20260720.svg" alt="" className="absolute left-1/2 top-1/2 z-10 h-auto w-full max-w-[590px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_22px_40px_rgba(3,28,45,0.35)]" />
      </div>

      <p dir="rtl" className="mt-2 text-center text-xl font-bold tracking-[0.04em] text-[#d5edf3]/80 sm:text-2xl">
        وضوح ← قرار ← تنفيذ ← تقدّم
      </p>
    </div>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#0d4962] text-[#f7f3eb]">
      <section className="relative min-h-screen overflow-hidden">
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(58% 78% at 20% 48%, rgba(64,161,185,0.30), transparent 66%), radial-gradient(42% 58% at 77% 26%, rgba(38,111,139,0.22), transparent 70%), linear-gradient(128deg, #0a3d55 0%, #0f5970 42%, #123f58 72%, #0a2d43 100%)" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06283b]/45 to-transparent" />

        <div dir="ltr" className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="relative hidden min-h-[620px] items-center justify-center lg:flex">
            <HeroArchStage />
          </div>

          <div className="max-w-2xl justify-self-end text-right" dir="rtl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#c7aa66] sm:text-base">سايبر ويل</p>

            <h1 className="mt-7 font-display text-5xl font-light leading-[1.12] tracking-tight text-[#f7f3eb] sm:text-6xl lg:text-7xl">
              <span className="block">من حيث أنت…</span>
              <span className="mt-3 block text-[#c7aa66]">إلى حيث تريد أن تكون</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg font-semibold leading-9 text-[#e6f1f3] sm:text-xl">
              نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال بثقة إلى المرحلة التالية.
            </p>

            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-[#bdd7de] sm:text-lg">
              حلول رقمية وأمن سيبراني تبدأ بفهم المشكلة، ثم تحديد الخطوة الصحيحة، ثم تنفيذ ما يحتاجه عملك فعلًا.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-start">
              <a href="#" className="inline-flex min-h-14 items-center justify-center rounded-md bg-[#b89a5a] px-7 text-base font-bold text-[#102a38] shadow-[0_12px_30px_rgba(2,22,34,0.24)] transition hover:bg-[#c6aa70]">ابدأ محادثة الآن</a>
              <a href="#" className="inline-flex min-h-14 items-center justify-center rounded-md border border-[#cde7ed]/25 bg-white/[0.06] px-7 text-base font-bold text-[#f7f3eb] backdrop-blur-sm transition hover:border-[#c7aa66]/50 hover:bg-white/[0.10]">شاركنا مشكلتك</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
