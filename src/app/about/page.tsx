import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

const description =
  "تعرّف على CyberWeel ومنهجها في فهم المشكلة، تبسيط القرار، وتنفيذ حلول رقمية وعملية تساعد الأعمال على التقدم بثقة.";

export const metadata: Metadata = {
  title: "عن CyberWeel: وضوح في القرار وتنفيذ عملي",
  description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "عن CyberWeel — وضوح، قرار، وتنفيذ عملي",
    description,
    url: "https://www.cyberweel.com/about",
  },
};

export default function AboutPage() {
  return <HomePageClient initialView="about" />;
}
