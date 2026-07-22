import { SegmentedHeroArch } from "@/components/brand/segmented-hero-arch";

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
          <div className="relative hidden min-h-[620px] items-center justify-center lg:flex">
            <SegmentedHeroArch />
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
