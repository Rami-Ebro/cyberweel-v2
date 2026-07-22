import { HeroFluidBackground } from "@/components/brand/hero-fluid-background";

export const metadata = {
  title: "Hero Background Preview | CyberWeel",
  robots: { index: false, follow: false },
};

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-background p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="eyebrow-camel">CyberWeel</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            معاينة الخلفية فقط
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            هذه صفحة اختبار مستقلة للخلفية قبل تركيبها داخل الهيرو الرئيسي.
          </p>
        </div>

        <section className="relative min-h-[680px] overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          <HeroFluidBackground />

          <div className="relative z-10 flex min-h-[680px] items-center justify-center p-8 text-center">
            <div className="max-w-xl rounded-2xl border border-white/60 bg-background/70 p-8 shadow-lg backdrop-blur-sm">
              <p className="eyebrow-camel">من حيث أنت</p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
                خلفية هادئة، جاهزة للدمج
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                لا صور، لا مولّدات، ولا تعديل مباشر على الهيرو الحالي. مجرد مكوّن مستقل يمكن ضبطه ثم تركيبه لاحقًا.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
