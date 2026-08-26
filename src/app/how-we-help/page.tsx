import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/how-we-help",
  },
  openGraph: {
    url: "https://www.cyberweel.com/how-we-help",
  },
};

export default function HowWeHelpPage() {
  return <HomePageClient initialView="how-we-help" />;
}
