import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "https://www.cyberweel.com/about",
  },
};

export default function AboutPage() {
  return <HomePageClient initialView="about" />;
}
