import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

const description =
  "حلول CyberWeel للمواقع والمنصات، الأنظمة المخصصة، الأتمتة والذكاء الاصطناعي، الأمن السيبراني، والتحليل لدعم قرارات الأعمال.";

export const metadata: Metadata = {
  title: "كيف نساعدك: مواقع، أنظمة، أتمتة وذكاء اصطناعي",
  description,
  alternates: {
    canonical: "/how-we-help",
  },
  openGraph: {
    title: "كيف تساعد CyberWeel أعمالك",
    description,
    url: "https://www.cyberweel.com/how-we-help",
  },
};

export default function HowWeHelpPage() {
  return <HomePageClient initialView="how-we-help" />;
}
