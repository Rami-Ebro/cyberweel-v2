export const metadata = {
  title: "Hero Arch Preview | CyberWeel",
  robots: { index: false, follow: false },
};

function HeroArchStage() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative h-[640px] w-[620px]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6ea8ff]/10"
          style={{ transform: "translate(-50%, -50%) rotate(8deg)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[470px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7fb7ff]/8"
          style={{ transform: "translate(-50%, -50%) rotate(-14deg)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8bc1ff]/10"
          style={{ transform: "translate(-50%, -50%) rotate(18deg)" }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute left-[34px] top-[90px] h-[180px] w-[300px] rounded-full border border-[#76b0ff]/12"
          style={{
            clipPath: "inset(0 0 48% 0)",
            transform: "rotate(-10deg)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[26px] top-[120px] h-[170px] w-[260px] rounded-full border border-[#76b0ff]/10"
          style={{
            clipPath: "inset(45% 0 0 0)",
            transform: "rotate(18deg)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[48px] bottom-[120px] h-[160px] w-[260px] rounded-full border border-[#76b0ff]/10"
          style={{
            clipPath: "inset(0 0 50% 0)",
            transform: "rotate(12deg)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[52px] bottom-[110px] h-[150px] w-[270px] rounded-full border border-[#76b0ff]/12"
          style={{
            clipPath: "inset(52% 0 0 0)",
            transform: "rotate(-14deg)",
          }}
        />

        <span className="pointer-events-none absolute left-[88px] top-[138px] h-2.5 w-2.5 rounded-full bg-[#9ecbff]/20" />
        <span className="pointer-events-none absolute left-[120px] top-[182px] h-1.5 w-1.5 rounded-full bg-[#9ecbff]/25" />
        <span className="pointer-events-none absolute right-[92px] top-[160px] h-2 w-2 rounded-full bg-[#9ecbff]/18" />
        <span className="pointer-events-none absolute right-[132px] top-[212px] h-1.5 w-1.5 rounded-full bg-[#9ecbff]/22" />
        <span className="pointer-events-none absolute left-[104px] bottom-[170px] h-2 w-2 rounded-full bg-[#9ecbff]/18" />
        <span className="pointer-events-none absolute right-[116px] bottom-[162px] h-2.5 w-2.5 rounded-full bg-[#9ecbff]/16" />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[292px] h-[420px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(231,193,94,0.12) 0%, rgba(122,184,255,0.08) 46%, rgba(122,184,255,0) 76%)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[92px] h-[370px] -translate-x-1/2 rounded-full blur-[18px]"
          style={{
            width: "108px",
            background:
              "linear-gradient(180deg, rgba(231,193,94,0.58) 0%, rgba(231,193,94,0.26) 24%, rgba(166,214,255,0.14) 62%, rgba(166,214,255,0) 100%)",
            clipPath: "polygon(44% 0%, 56% 0%, 76% 100%, 24% 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[106px] h-[320px] -translate-x-1/2 rounded-full blur-[10px]"
          style={{
            width: "52px",
            background:
              "linear-gradient(180deg, rgba(255,246,220,0.72) 0%, rgba(231,193,94,0.26) 34%, rgba(173,221,255,0.10) 76%, rgba(173,221,255,0) 100%)",
            clipPath: "polygon(46% 0%, 54% 0%, 68% 100%, 32% 100%)",
          }}
        />

        <img
          src="/cyberweel-logo-20260720.svg"
          alt=""
          className="absolute left-1/2 top-1/2 h-auto w-full max-w-[590px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.35)]"
        />
      </div>

      <p
        dir="rtl"
        className="mt-2 text-center text-sm font-semibold tracking-[0.08em] text-[#d8d2c4]/65 sm:text-base"
      >
        وضوح ← قرار ← تنفيذ ← تقدّم
      </p>
    </div>
  );
}

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
          <div className="relative hidden min-h-[620px] items-center justify-center lg:flex">
            <HeroArchStage />
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
          </div>
        </div>
      </section>
    </main>
  );
}
