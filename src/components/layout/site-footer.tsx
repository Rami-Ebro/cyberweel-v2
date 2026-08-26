"use client";

import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ArchMotif } from "@/components/brand/motif";
import { NAV_ITEMS, BRAND, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { SocialLinks } from "@/components/site/social-links";

const FOOTER_ITEMS = NAV_ITEMS.filter((item) => item.id !== "share-challenge");

function FooterWordmark({ isArabic }: { isArabic: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="inline-flex rounded-xl border border-white/15 bg-white/95 p-2.5 shadow-sm">
        <Logo size={52} />
      </span>
      <span className="flex flex-col">
        <span
          aria-label="CyberWeel"
          className="block h-[38px] w-[142px] bg-[#F7F3EB]"
          style={{
            WebkitMaskImage: "url('/cyberweel-wordmark.svg')",
            maskImage: "url('/cyberweel-wordmark.svg')",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        <span className="mt-1 text-[11px] font-bold tracking-[0.18em] text-[#D8D2C4]">
          {isArabic ? "شريكك للتقدّم" : "YOUR PARTNER IN PROGRESS"}
        </span>
      </span>
    </span>
  );
}

export function SiteFooter() {
  const { navigate } = useNav();
  const { t, dir } = useI18n();
  const isArabic = dir === "rtl";

  const go = (id: ViewId) => navigate(id);
  const shareLabel = isArabic ? "شاركنا مشكلتك" : "Share your challenge";
  const methodology = isArabic ? "وضوح ← قرار ← تقدّم" : "Clarity · Decision · Progress";
  const copyright = isArabic
    ? "© 2026 CyberWeel — جميع الحقوق محفوظة"
    : "© 2026 CyberWeel — All rights reserved";
  const legalLabel = isArabic ? "السياسات والأنظمة" : "Policies & Legal";

  const navLabel = (id: ViewId) => {
    if (isArabic && id === "how-we-help") return "كيف نساعدك";
    if (isArabic && id === "partner") return "انضم إلينا";
    if (!isArabic && id === "partner") return "Work with us";
    return t.nav[id];
  };

  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-floral">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 85% -10%, rgba(184,154,90,0.18), transparent 55%), radial-gradient(90% 60% at 10% 110%, rgba(184,154,90,0.08), transparent 60%), linear-gradient(180deg, #0d121b 0%, #111827 50%, #090c12 100%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-20 opacity-[0.10] lg:block">
        <ArchMotif size={520} onDark />
      </div>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-camel/70 to-transparent" />

      <div className="cw-container relative py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <FooterWordmark isArabic={isArabic} />
            <p className="mt-6 font-display text-2xl font-normal leading-snug text-[#F7F3EB]">
              {isArabic ? t.footer.tagline : "From where you are… to where you want to be."}
            </p>
            <p className="mt-5 text-base leading-relaxed text-[#D8D2C4]/85">
              {isArabic
                ? t.footer.description
                : "We help businesses understand the real problem, make sound decisions, and build the digital solutions their next stage requires."}
            </p>
          </div>

          <div>
            <p className="eyebrow !text-[#D8D2C4]/75">{isArabic ? t.footer.navigate : "Explore"}</p>
            <ul className="mt-5 space-y-3">
              {FOOTER_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    className="focus-ring inline-flex items-center gap-2 rounded-md text-sm text-[#D8D2C4]/90 transition-colors hover:text-[#F7F3EB]"
                  >
                    {navLabel(item.id)}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-7 border-t border-[#F7F3EB]/10 pt-5 text-sm font-semibold tracking-wide text-[#D8D2C4]/85">
              {methodology}
            </p>
          </div>

          <div>
            <p className="eyebrow !text-[#D8D2C4]/75">{isArabic ? t.footer.stayInTouch : "Stay in touch"}</p>
            <p className="mt-5 text-base leading-relaxed text-[#D8D2C4]/85">
              {isArabic ? t.footer.stayInTouchBody : "No mailing lists or noise. Just a direct line when you have something worth discussing."}
            </p>
            <ul className="mt-5 space-y-3 text-base">
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="focus-ring inline-flex items-center gap-2 rounded-md text-[#D8D2C4]/90 transition-colors hover:text-[#F7F3EB]"
                >
                  <Mail className="h-4 w-4 text-accent" />
                  {BRAND.email}
                </a>
              </li>
            </ul>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[#D8D2C4]/75">
                {isArabic ? t.footer.followUs : "Follow CyberWeel"}
              </p>
              <SocialLinks onDark size="sm" />
            </div>

            <button
              type="button"
              onClick={() => go("share-challenge")}
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-md bg-camel px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-camel/90"
            >
              {shareLabel}
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 border-t border-[#F7F3EB]/10 pt-7 text-center sm:flex-row sm:gap-5">
          <p className="text-base text-[#D8D2C4]/75">{copyright}</p>
          <span aria-hidden className="hidden h-4 w-px bg-[#F7F3EB]/20 sm:block" />
          <a
            href="/legal"
            className="focus-ring rounded-md text-sm font-semibold text-[#D8D2C4]/90 underline decoration-[#D8D2C4]/30 underline-offset-4 transition-colors hover:text-[#F7F3EB] hover:decoration-camel"
          >
            {legalLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
