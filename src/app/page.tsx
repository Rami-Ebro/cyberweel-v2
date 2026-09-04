import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";
import { launchCopy } from "@/components/sections/launch-home-copy";

const description =
  "تساعد CyberWeel الشركات على فهم التحديات الرقمية والتشغيلية، اتخاذ قرارات أوضح، وبناء المواقع والأنظمة والأتمتة والحماية التي تحتاجها المرحلة التالية.";

export const metadata: Metadata = {
  title: "حلول رقمية عملية للأعمال",
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CyberWeel — حلول رقمية عملية للأعمال",
    description,
    url: "https://www.cyberweel.com/",
  },
};

export default function Home() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: launchCopy.ar.faq.items.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: {
        "@type": "Answer",
        text,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <HomePageClient />
    </>
  );
}
