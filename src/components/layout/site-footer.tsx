"use client";

import { Mail, Keyboard, ArrowUp } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { ArchMotif } from "@/components/brand/motif";
import { NAV_ITEMS, BRAND, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { SocialLinks } from "@/components/site/social-links";

export function SiteFooter() {
  const { navigate, openShortcuts } = useNav();
  const { t } = useI18n();

  const go = (id: ViewId) => navigate(id);

  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-floral">
      {/* Depth: stronger gradient + architectural arch motif backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 85% -10%, rgba(184,154,90,0.18), transparent 55%), radial-gradient(90% 60% at 10% 110%, rgba(184,154,90,0.08), transparent 60%), linear-gradient(180deg, #0d121b 0%, #111827 50%, #090c12 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-20 opacity-[0.10] lg:block"
      >
        <ArchMotif size={520} onDark />
      </div>
      {/* Top hairline accent — stronger */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-camel/70 to-transparent"
      />

      <div className="cw-container relative py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <LogoLockup onDark size={52} />
            <p className="mt-6 font-display text-2xl font-light leading-snug text-floral">
              {t.footer.tagline}
            </p>
            <p className="mt-6 text-base leading-relaxed text-bone/70">
              {t.footer.description}
            </p>
          </div>

          {/* Navigate */}
          <div>
            <p className="eyebrow text-bone/60">{t.footer.navigate}</p>
            <ul className="mt-5 space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    className="focus-ring inline-flex items-center gap-2 rounded-md text-sm text-bone/85 transition-colors hover:text-floral"
                  >
                    {t.nav[item.id]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay in touch */}
          <div>
            <p className="eyebrow text-bone/60">{t.footer.stayInTouch}</p>
            <p className="mt-5 text-base leading-relaxed text-bone/70">
              {t.footer.stayInTouchBody}
            </p>
            <ul className="mt-5 space-y-3 text-base">
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="focus-ring inline-flex items-center gap-2 rounded-md text-bone/85 transition-colors hover:text-floral"
                >
                  <Mail className="h-4 w-4 text-accent" />
                  {BRAND.email}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openShortcuts}
                  className="focus-ring inline-flex items-center gap-2 rounded-md text-bone/85 transition-colors hover:text-floral"
                >
                  <Keyboard className="h-4 w-4 text-accent" />
                  {t.footer.keyboardShortcuts}
                  <kbd className="rounded border border-bone/20 px-1.5 py-0.5 text-sm text-bone/60">?</kbd>
                </button>
              </li>
            </ul>
            {/* Social links */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-bone/50">
                {t.footer.followUs}
              </p>
              <SocialLinks onDark size="sm" />
            </div>
            <button
              type="button"
              onClick={() => go("share-challenge")}
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-md border border-camel/40 bg-camel/10 px-5 py-2.5 text-sm font-medium text-floral transition-colors hover:bg-camel/20"
            >
              {t.footer.shareChallenge}
            </button>
          </div>
        </div>

        {/* Quiet arch motif divider */}
        <div className="mt-14 flex justify-center" aria-hidden>
          <ArchMotif size={56} onDark />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-floral/10 pt-8 text-base text-bone/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t.footer.copyright.replace("© ", "")}</p>
          <p className="font-medium tracking-wide text-bone/70">
            {t.footer.methodology}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md text-bone/50 transition-colors hover:text-floral"
            aria-label={t.footer.backToTop}
          >
            {t.footer.backToTop}
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
=======
"use client";

import { Mail, Keyboard, ArrowUp } from "lucide-react";
import { LogoLockup } from "@/components/brand/logo";
import { ArchMotif } from "@/components/brand/motif";
import { NAV_ITEMS, BRAND, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { SocialLinks } from "@/components/site/social-links";

export function SiteFooter() {
  const { navigate, openShortcuts } = useNav();
  const { t } = useI18n();

  const go = (id: ViewId) => navigate(id);

  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-floral">
      {/* Depth: stronger gradient + architectural arch motif backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 85% -10%, rgba(184,154,90,0.18), transparent 55%), radial-gradient(90% 60% at 10% 110%, rgba(184,154,90,0.08), transparent 60%), linear-gradient(180deg, #0d121b 0%, #111827 50%, #090c12 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-20 opacity-[0.10] lg:block"
      >
        <ArchMotif size={520} onDark />
      </div>
      {/* Top hairline accent — stronger */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-camel/70 to-transparent"
      />

      <div className="cw-container relative py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <LogoLockup onDark size={52} />
            <p className="mt-6 font-display text-2xl font-light leading-snug text-floral">
              {t.footer.tagline}
            </p>
            <p className="mt-6 text-base leading-relaxed text-bone/70">
              {t.footer.description}
            </p>
          </div>

          {/* Navigate */}
          <div>
            <p className="eyebrow text-bone/60">{t.footer.navigate}</p>
            <ul className="mt-5 space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    className="focus-ring inline-flex items-center gap-2 rounded-md text-sm text-bone/85 transition-colors hover:text-floral"
                  >
                    {t.nav[item.id]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay in touch */}
          <div>
            <p className="eyebrow text-bone/60">{t.footer.stayInTouch}</p>
            <p className="mt-5 text-base leading-relaxed text-bone/70">
              {t.footer.stayInTouchBody}
            </p>
            <ul className="mt-5 space-y-3 text-base">
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="focus-ring inline-flex items-center gap-2 rounded-md text-bone/85 transition-colors hover:text-floral"
                >
                  <Mail className="h-4 w-4 text-accent" />
                  {BRAND.email}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openShortcuts}
                  className="focus-ring inline-flex items-center gap-2 rounded-md text-bone/85 transition-colors hover:text-floral"
                >
                  <Keyboard className="h-4 w-4 text-accent" />
                  {t.footer.keyboardShortcuts}
                  <kbd className="rounded border border-bone/20 px-1.5 py-0.5 text-sm text-bone/60">?</kbd>
                </button>
              </li>
            </ul>
            {/* Social links */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-bone/50">
                {t.footer.followUs}
              </p>
              <SocialLinks onDark size="sm" />
            </div>
            <button
              type="button"
              onClick={() => go("share-challenge")}
              className="focus-ring mt-6 inline-flex items-center gap-2 rounded-md border border-camel/40 bg-camel/10 px-5 py-2.5 text-sm font-medium text-floral transition-colors hover:bg-camel/20"
            >
              {t.footer.shareChallenge}
            </button>
          </div>
        </div>

        {/* Quiet arch motif divider */}
        <div className="mt-14 flex justify-center" aria-hidden>
          <ArchMotif size={56} onDark />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-floral/10 pt-8 text-base text-bone/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t.footer.copyright.replace("© ", "")}</p>
          <p className="font-medium tracking-wide text-bone/70">
            {t.footer.methodology}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md text-bone/50 transition-colors hover:text-floral"
            aria-label={t.footer.backToTop}
          >
            {t.footer.backToTop}
            <ArrowUp className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
