import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/partner",
  },
  openGraph: {
    url: "https://www.cyberweel.com/partner",
  },
};

export default function PartnerPage() {
  return <HomePageClient initialView="partner" />;
}
