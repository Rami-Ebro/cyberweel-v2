import { HeroFluidBackground } from "@/components/brand/hero-fluid-background";

export const metadata = {
  title: "Hero Background Preview | CyberWeel",
  robots: { index: false, follow: false },
};

export default function HeroBackgroundPreviewPage() {
  return (
    <main className="min-h-screen bg-[#070b13]">
      <section className="relative min-h-screen overflow-hidden">
        <HeroFluidBackground />

        <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
          <div className="rounded-full border border-[#b89a5a]/35 bg-[#111827]/55 px-5 py-2 text-sm font-semibold tracking-wide text-[#d8d2c4] backdrop-blur-md">
            معاينة الخلفية الداكنة فقط
          </div>
        </div>
      </section>
    </main>
  );
}
