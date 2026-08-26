import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/share-challenge",
  },
  openGraph: {
    url: "https://www.cyberweel.com/share-challenge",
  },
};

export default function ShareChallengePage() {
  return <HomePageClient initialView="share-challenge" />;
}
