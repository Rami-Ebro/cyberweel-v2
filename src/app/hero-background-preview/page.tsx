import Link from "next/link";

export const metadata = {
  title: "Hero Background Preview | CyberWeel",
  robots: { index: false, follow: false },
};

function FluidBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#111827]" />

      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70% 80% at 18% 36%, rgba(184,154,90,0.10), transparent 62%), radial-gradient(70% 70% at 84% 20%, rgba(216,210,196,0.055), transparent 68%), radial-gradient(55% 60% at 55% 110%, rgba(247,243,235,0.045), transparent 70%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="waveGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#B89A5A" stopOpacity="0" />
            <stop offset="0.38" stopColor="#B89A5A" stopOpacity="0.34" />
            <stop offset="0.76" stopColor="#D8D2C4" stopOpacity="0.16" />
            <stop offset="1" stopColor="#D8D2C4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="waveBone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F7F3EB" stopOpacity="0" />
            <stop offset="0.45" stopColor="#D8D2C4" stopOpacity="0.18" />
            <stop offset="1" stopColor="#F7F3EB" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="softMist" cx="0" cy="0" r="1" gradientTransform="translate(260 590) rotate(-12) scale(660 310)">
            <stop stopColor="#D8D2C4" stopOpacity="0.075" />
            <stop offset="1" stopColor="#D8D2C4" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="260" cy="590" rx="660" ry="310" fill="url(#softMist)" />

        <path
          d="M-180 670C95 535 260 505 474 548C661 585 773 680 1016 666C1244 653 1398 548 1740 594"
          stroke="url(#waveGold)"
          strokeWidth="2"
        />
        <path
          d="M-210 716C98 576 302 558 512 604C704 646 843 718 1081 694C1297 672 1451 598 1768 644"
          stroke="url(#waveBone)"
          strokeWidth="1.25"
        />
        <path
          d="M-120 606C148 492 296 458 478 486C664 515 790 600 1007 590C1235 579 1397 492 1690 514"
          stroke="#B89A5A"
          strokeOpacity="0.09"
          strokeWidth="10"
        />

        <circle cx="145" cy="118" r="265" stroke="#B89A5A" strokeOpacity="0.10" strokeWidth="1.4" />
        <circle cx="145" cy="118" r="205" stroke="#D8D2C4" strokeOpacity="0.07" strokeWidth="1" />
        <circle cx="145" cy="118" r="145" stroke="#F7F3EB" strokeOpacity="0.05" strokeWidth="1" />

        <path
          d="M1190 -60C1298 66 1330 212 1278 362C1232 495 1124 574 1022 651"
          stroke="#D8D2C4"
          strokeOpacity="0.055"
          strokeWidth="1.2"
        />
        <path
          d="M1244 -40C1364 108 1390 256 1329 402C1285 510 1193 590 1086 676"
          stroke="#B89A5A"
          strokeOpacity="0.065"
          strokeWidth="1"
        />
      </svg>

      <div
        className="absolute bottom-[-18%] left-[-8%] h-[58%] w-[62%] rounded-[50%] blur-3xl"
        style={{ background: "rgba(216,210,196,0.035)" }}
      />
    </div>
  );
}

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#111827] text-[#F7F3EB]">
      <section className="relative flex min-h-screen overflow-hidden">
        <FluidBackground />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#B89A5A]">
              CYBERWEEL
            </p>

            <h1 className="mt-7 font-display text-4xl font-light leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block">من حيث أنت…</span>
              <span className="mt-2 block text-[#B89A5A]">إلى حيث تريد أن تكون</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-9 text-[#D8D2C4] sm:text-xl">
              نساعدك على رؤية الصورة بشكل أوضح، واتخاذ القرار المناسب، والانتقال بثقة إلى المرحلة التالية.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#B89A5A] px-6 font-semibold text-[#111827] transition hover:brightness-105"
              >
                ابدأ محادثة الآن
              </a>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#D8D2C4]/25 bg-white/[0.025] px-6 font-semibold text-[#F7F3EB] transition hover:bg-white/[0.06]"
              >
                العودة إلى الموقع
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[520px] w-full max-w-[520px] lg:block">
            <div className="absolute inset-[6%] rounded-t-[48%] border border-[#B89A5A]/25" />
            <div className="absolute inset-[13%] rounded-t-[48%] border border-[#D8D2C4]/12" />
            <div className="absolute inset-[20%] rounded-t-[48%] bg-gradient-to-b from-white/[0.03] to-transparent" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-52 w-52 items-center justify-center rounded-full border border-[#B89A5A]/20 bg-[#111827]/65 shadow-[0_0_90px_rgba(184,154,90,0.12)] backdrop-blur-sm">
                <span className="font-display text-5xl font-light tracking-tight text-[#F7F3EB]">
                  CW
                </span>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-[0.32em] text-[#D8D2C4]/65">
              CLARITY · DECISION · PROGRESS
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
