export const metadata = {
  title: "Hero Arch Preview | CyberWeel",
  robots: { index: false, follow: false },
};

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#070b13] text-[#f7f3eb]">
      <section className="relative min-h-screen overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 80% at 18% 50%, rgba(38,58,88,0.28), transparent 70%), linear-gradient(110deg, #070b13 0%, #0b111d 45%, #111827 72%, #080c14 100%)",
          }}
        />

        <div
          dir="ltr"
          className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10"
        >
          <div className="relative hidden min-h-[620px] items-center justify-center lg:flex" aria-hidden>
            <svg
              viewBox="0 0 640 720"
              className="h-[620px] w-full max-w-[560px] overflow-visible"
              role="presentation"
            >
              <defs>
                <linearGradient id="stoneFace" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2a3950" />
                  <stop offset="0.48" stopColor="#1a2639" />
                  <stop offset="1" stopColor="#0b111c" />
                </linearGradient>
                <linearGradient id="stoneEdge" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#49658d" stopOpacity="0.78" />
                  <stop offset="1" stopColor="#111827" stopOpacity="0.08" />
                </linearGradient>
                <linearGradient id="goldStone" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f0ce7f" />
                  <stop offset="0.45" stopColor="#c29b4d" />
                  <stop offset="1" stopColor="#7b5723" />
                </linearGradient>
                <filter id="archShadow" x="-40%" y="-30%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="24" stdDeviation="20" floodColor="#000000" floodOpacity="0.48" />
                </filter>
                <filter id="goldGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <ellipse cx="310" cy="365" rx="255" ry="280" fill="#35527b" opacity="0.12" />

              <g filter="url(#archShadow)">
                <path
                  d="M112 660V392C112 194 199 90 310 90s198 104 198 302v268"
                  fill="none"
                  stroke="#05080e"
                  strokeWidth="176"
                  strokeLinecap="butt"
                />
                <path
                  d="M112 660V392C112 194 199 90 310 90s198 104 198 302v268"
                  fill="none"
                  stroke="url(#stoneFace)"
                  strokeWidth="148"
                  strokeLinecap="butt"
                />
                <path
                  d="M112 660V392C112 194 199 90 310 90s198 104 198 302v268"
                  fill="none"
                  stroke="url(#stoneEdge)"
                  strokeWidth="5"
                  strokeLinecap="butt"
                  opacity="0.8"
                />

                <g stroke="#070b13" strokeWidth="11">
                  <path d="M104 566 L187 534" />
                  <path d="M104 470 L193 449" />
                  <path d="M122 365 L208 386" />
                  <path d="M163 270 L235 323" />
                  <path d="M224 178 L271 278" />
                  <path d="M349 178 L328 278" />
                  <path d="M421 254 L365 323" />
                  <path d="M493 354 L410 386" />
                  <path d="M516 463 L426 449" />
                  <path d="M516 566 L433 534" />
                </g>

                <path
                  d="M274 76 L346 76 L364 175 L310 216 L256 175 Z"
                  fill="url(#goldStone)"
                  stroke="#f2d697"
                  strokeOpacity="0.72"
                  strokeWidth="3"
                  filter="url(#goldGlow)"
                />
                <path d="M279 174 L310 216 L341 174" fill="none" stroke="#6e4c1d" strokeWidth="3" opacity="0.65" />

                <path
                  d="M185 660V406C185 264 239 192 310 192s125 72 125 214v254"
                  fill="none"
                  stroke="#03060b"
                  strokeWidth="20"
                />
              </g>
            </svg>
          </div>

          <div className="max-w-2xl justify-self-end text-right" dir="rtl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#b89a5a] sm:text-base">
              سايبر ويل
            </p>

            <h1 className="mt-7 font-display text-5xl font-light leading-[1.12] tracking-tight text-[#f7f3eb] sm:text-6xl lg:text-7xl">
              <span className="block">من حيث أنت…</span>
              <span className="mt-3 block text-[#b89a5a]">
                إلى حيث تريد أن تكون
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg font-semibold leading-9 text-[#d8d2c4]/90 sm:text-xl">
              نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال
              بثقة إلى المرحلة التالية.
            </p>

            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-[#d8d2c4]/70 sm:text-lg">
              حلول رقمية وأمن سيبراني تبدأ بفهم المشكلة، ثم تحديد الخطوة الصحيحة،
              ثم تنفيذ ما يحتاجه عملك فعلًا.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-start">
              <a
                href="#"
                className="inline-flex min-h-14 items-center justify-center rounded-md bg-[#b89a5a] px-7 text-base font-bold text-[#111827] transition hover:bg-[#c6aa70]"
              >
                ابدأ محادثة الآن
              </a>

              <a
                href="#"
                className="inline-flex min-h-14 items-center justify-center rounded-md border border-[#d8d2c4]/25 bg-white/[0.035] px-7 text-base font-bold text-[#f7f3eb] backdrop-blur-sm transition hover:border-[#b89a5a]/50 hover:bg-white/[0.06]"
              >
                شاركنا مشكلتك
              </a>
            </div>

            <div className="mt-9 flex items-center gap-3 text-sm font-semibold text-[#d8d2c4]/65 sm:text-base">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b89a5a]" />
              <span>وضوح ← قرار ← تنفيذ ← تقدّم</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
