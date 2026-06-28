"use client";

import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";

/**
 * Injects a BreadcrumbList JSON-LD based on the current hash-routed view,
 * for rich breadcrumb snippets in search results. Calm, no UI.
 * The view is synced via useSyncExternalStore so it's stable post-hydration.
 */
export function BreadcrumbLd() {
  const { view } = useNav();
  const { t } = useI18n();

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: t.nav.home,
      item: "https://cyberweel.com/",
    },
  ];

  if (view !== "home") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: t.nav[view],
      item: `https://cyberweel.com/#/${view}`,
    });
  }

  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
