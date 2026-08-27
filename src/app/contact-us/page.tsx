import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

const description =
  "تواصل مع CyberWeel لمناقشة موقع، نظام، أتمتة، ذكاء اصطناعي، حماية رقمية، أو تحدٍ تشغيلي يحتاج قرارًا واضحًا وتنفيذًا عمليًا.";

export const metadata: Metadata = {
  title: "تواصل مع CyberWeel",
  description,
  alternates: {
    canonical: "/contact-us",
  },
  openGraph: {
    title: "تواصل مع CyberWeel",
    description,
    url: "https://www.cyberweel.com/contact-us",
  },
};

export default function ContactUsPage() {
  return <HomePageClient initialView="contact" />;
}
