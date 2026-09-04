import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

const description =
  "صف تحديك لـCyberWeel لنفهم المشكلة والسياق ونساعدك على تحديد الخطوة الرقمية أو التشغيلية الأكثر منطقية قبل التنفيذ.";

export const metadata: Metadata = {
  title: "شاركنا تحديك الرقمي أو التشغيلي",
  description,
  alternates: {
    canonical: "/share-challenge",
  },
  openGraph: {
    title: "شاركنا تحديك — CyberWeel",
    description,
    url: "https://www.cyberweel.com/share-challenge",
  },
};

export default function ShareChallengePage() {
  return <HomePageClient initialView="share-challenge" />;
}
