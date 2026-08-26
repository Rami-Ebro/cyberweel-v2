import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    url: "https://www.cyberweel.com/contact-us",
  },
};

export default function ContactUsPage() {
  return <HomePageClient initialView="contact" />;
}
