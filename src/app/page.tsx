"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavContext } from "@/components/site/nav-context";
import { I18nProvider, useI18n } from "@/components/site/i18n";
import { useViewRouter } from "@/components/site/use-view-router";
import { useKeyboardNav } from "@/components/site/use-keyboard-nav";
import { ScrollUtilities } from "@/components/site/scroll-utilities";
import { ShortcutsHelp } from "@/components/site/shortcuts-help";
import { BreadcrumbLd } from "@/components/site/breadcrumb-ld";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { BRAND } from "@/lib/site-data";
import { FinalHomeView } from "@/components/sections/final-home-view";
import type { ViewId } from "@/lib/site-data";

function ViewLoading() {
  return (
    <div className="cw-container py-24" role="status" aria-live="polite">
      <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-12 max-w-2xl animate-pulse rounded bg-muted" />
      <div className="mt-5 h-6 max-w-xl animate-pulse rounded bg-muted" />
    </div>
  );
}

const HowWeHelpView = dynamic(
  () => import("@/components/sections/how-we-help-view").then((module) => module.HowWeHelpView),
  { loading: ViewLoading },
);
const ShareChallengeView = dynamic(
  () => import("@/components/sections/share-challenge-view").then((module) => module.ShareChallengeView),
  { loading: ViewLoading },
);
const PartnerView = dynamic(
  () => import("@/components/sections/partner-view").then((module) => module.PartnerView),
  { loading: ViewLoading },
);
const AboutView = dynamic(
  () => import("@/components/sections/about-view").then((module) => module.AboutView),
  { loading: ViewLoading },
);
const ContactView = dynamic(
  () => import("@/components/sections/contact-view").then((module) => module.ContactView),
  { loading: ViewLoading },
);

const VIEWS: Record<ViewId, React.ComponentType> = {
  home: FinalHomeView,
  "how-we-help": HowWeHelpView,
  "share-challenge": ShareChallengeView,
  partner: PartnerView,
  about: AboutView,
  contact: ContactView,
};

export default function Home() {
  return (
    <I18nProvider>
      <HomeInner />
    </I18nProvider>
  );
}

function HomeInner() {
  const { view, navigate } = useViewRouter();
  const { t } = useI18n();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const Current = VIEWS[view];

  useKeyboardNav(navigate);

  return (
    <NavContext.Provider value={{ view, navigate, openShortcuts: () => setShortcutsOpen(true) }}>
      <div className="flex min-h-screen flex-col bg-background">
        <style jsx global>{`
          .eyebrow,
          .eyebrow-camel {
            font-size: 1rem;
            line-height: 1.6;
            font-weight: 700;
          }

          @media (min-width: 640px) {
            .eyebrow,
            .eyebrow-camel {
              font-size: 1.125rem;
            }
          }
        `}</style>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-floral">
          {t.common.skipToContent}
        </a>
        <ScrollUtilities />
        <SiteHeader />
        <main id="main" className="flex-1">
          <Current />
        </main>
        <SiteFooter />
        <WhatsAppButton number={BRAND.whatsapp} />
        <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <BreadcrumbLd />
      </div>
    </NavContext.Provider>
  );
}
