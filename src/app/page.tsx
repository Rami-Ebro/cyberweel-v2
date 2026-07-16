"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { LaunchSectionEnhancer } from "@/components/site/launch-section-enhancer";
import { BRAND } from "@/lib/site-data";
import { HomeView } from "@/components/sections/home-view";
import { HowWeHelpView } from "@/components/sections/how-we-help-view";
import { ShareChallengeView } from "@/components/sections/share-challenge-view";
import { PartnerView } from "@/components/sections/partner-view";
import { AboutView } from "@/components/sections/about-view";
import { ContactView } from "@/components/sections/contact-view";
import type { ViewId } from "@/lib/site-data";

const VIEWS: Record<ViewId, () => React.ReactElement> = {
  home: HomeView,
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

          #methodology .grid > :not([aria-hidden="true"]) {
            opacity: 1 !important;
            transform: none !important;
            visibility: visible !important;
          }

          @media (min-width: 640px) {
            .eyebrow,
            .eyebrow-camel {
              font-size: 1.125rem;
            }

            #methodology .grid {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }
          }
        `}</style>
        <LaunchSectionEnhancer />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-floral"
        >
          {t.common.skipToContent}
        </a>
        <ScrollUtilities />
        <SiteHeader />
        <main id="main" className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Current />
            </motion.div>
          </AnimatePresence>
        </main>
        <SiteFooter />
        <WhatsAppButton number={BRAND.whatsapp} />
        <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
        <BreadcrumbLd />
      </div>
    </NavContext.Provider>
  );
}
