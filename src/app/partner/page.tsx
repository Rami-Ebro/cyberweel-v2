import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

const description =
  "تعرّف على فرص التعاون مع CyberWeel كشريك تنفيذ أو سفير، وقدّم طلبك للانضمام إلى شبكة تعاون مبنية على الوضوح والاحتراف.";

export const metadata: Metadata = {
  title: "انضم إلى CyberWeel كشريك تنفيذ أو سفير",
  description,
  alternates: {
    canonical: "/partner",
  },
  openGraph: {
    title: "انضم إلى CyberWeel — شريك تنفيذ أو سفير",
    description,
    url: "https://www.cyberweel.com/partner",
  },
};

export default function PartnerPage() {
  return <HomePageClient initialView="partner" />;
}
