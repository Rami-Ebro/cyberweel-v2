import type { Metadata } from "next";
import { LegalPageClient } from "@/components/site/legal-page-client";
import { LegalFragmentNavigation } from "@/components/site/legal-fragment-navigation";

export const metadata: Metadata = {
  title: "Policies & Legal",
  description:
    "CyberWeel privacy policy, terms of use and service, cancellation and refund policy, cookie policy, and disclaimer.",
  alternates: {
    canonical: "/legal",
  },
  openGraph: {
    title: "Policies & Legal · CyberWeel",
    description:
      "Privacy, service terms, cancellations and refunds, cookies, and legal disclaimers for CyberWeel services.",
    url: "https://www.cyberweel.com/legal",
    type: "website",
  },
};

export default function LegalPage() {
  return (
    <>
      <LegalFragmentNavigation />
      <LegalPageClient />
    </>
  );
}
