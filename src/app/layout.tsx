import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Noto_Sans_Arabic, Amiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DashboardI18nProvider } from "@/components/dashboard-i18n-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-display-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const siteTitle = "CyberWeel — From where you are… to where you want to be";
const siteDescription =
  "CyberWeel helps businesses understand digital and operational challenges, make sound decisions, and build the websites, systems, automation, and protection their next stage genuinely needs.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cyberweel.com"),
  title: {
    default: siteTitle,
    template: "%s · CyberWeel",
  },
  description: siteDescription,
  keywords: [
    "CyberWeel",
    "digital solutions",
    "business systems",
    "web development",
    "SaaS development",
    "process automation",
    "artificial intelligence",
    "cybersecurity",
    "financial analysis",
    "business decision support",
  ],
  authors: [{ name: "CyberWeel" }],
  creator: "CyberWeel",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/logo.svg", color: "#111827" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://cyberweel.com",
    siteName: "CyberWeel",
    type: "website",
    locale: "en",
    alternateLocale: ["ar"],
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "CyberWeel — clarity, decision, and practical execution",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberWeel",
    description:
      "Understand the problem. Make the right decision. Build what the business genuinely needs.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CyberWeel",
    url: "https://cyberweel.com",
    logo: "https://cyberweel.com/logo.png",
    description: siteDescription,
    slogan: "From where you are… to where you want to be.",
    email: "hello@cyberweel.com",
    knowsAbout: [
      "Websites and digital platforms",
      "SaaS and custom business systems",
      "Mobile applications",
      "Process automation and artificial intelligence",
      "Cybersecurity and digital protection",
      "Financial analysis and decision support",
      "Brand positioning and conversion journeys",
      "Dynamic QR codes and smart links",
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is CyberWeel a digital agency?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Not in the conventional sense. CyberWeel begins by understanding the business problem and defining the right decision. When execution is needed, we design and build websites, systems, automation, cybersecurity safeguards, and other practical digital solutions.",
        },
      },
      {
        "@type": "Question",
        name: "What does Clarity, Decision, Progress mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Clarity means understanding the current situation and the real problem. Decision means choosing the most sensible next step. Progress means executing that decision deliberately and measuring whether it creates real value.",
        },
      },
      {
        "@type": "Question",
        name: "Does CyberWeel take on every project?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. CyberWeel may recommend a smaller step, improving what already exists, or waiting until the timing is right. The goal is to solve the right problem, not manufacture unnecessary work.",
        },
      },
      {
        "@type": "Question",
        name: "Who does CyberWeel work with?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CyberWeel works with business owners, founders, and teams that need to decide what to build, improve, automate, secure, or stop doing. A polished brief is not required.",
        },
      },
      {
        "@type": "Question",
        name: "How does a project begin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It begins with a clear description of the current situation, the challenge, and the desired outcome. CyberWeel reviews the request, identifies the most useful next step, and then discusses whether and how to proceed.",
        },
      },
    ],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CyberWeel",
    url: "https://cyberweel.com/",
    description: siteDescription,
    inLanguage: ["ar", "en"],
    publisher: {
      "@type": "Organization",
      name: "CyberWeel",
      url: "https://cyberweel.com",
    },
  };

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${notoSansArabic.variable} ${amiri.variable} font-sans antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
        <DashboardI18nProvider>{children}</DashboardI18nProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
      </body>
    </html>
  );
}
