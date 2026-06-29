import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Noto_Sans_Arabic, Amiri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://cyberweel.com"),
  title: {
    default: "CyberWeel — From where you are… to where you want to be",
    template: "%s · CyberWeel",
  },
  description:
    "CyberWeel is a progress partner. We help you see clearly, make the right decision, and move confidently toward the next stage. Clarity → Decision → Progress.",
  keywords: [
    "CyberWeel",
    "strategic clarity",
    "progress partner",
    "decision",
    "consultancy",
    "digital presence",
    "growth direction",
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
    other: [
      { rel: "mask-icon", url: "/logo.svg", color: "#111827" },
    ],
  },
  openGraph: {
    title: "CyberWeel — From where you are… to where you want to be",
    description:
      "A progress partner. We help you see clearly, make the right decision, and move confidently toward the next stage.",
    url: "https://cyberweel.com",
    siteName: "CyberWeel",
    type: "website",
    locale: "en",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "CyberWeel — From where you are… to where you want to be",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberWeel",
    description:
      "A progress partner. Clarity → Decision → Progress.",
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
    description:
      "CyberWeel is a progress partner. We help you see clearly, make the right decision, and move confidently toward the next stage.",
    slogan: "From where you are… to where you want to be.",
    email: "hello@cyberweel.com",
    knowsAbout: [
      "Strategic clarity",
      "Decision making",
      "Digital presence",
      "Brand positioning",
      "Growth direction",
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
          text: "Not in the usual sense. We're a progress partner. We help you find clarity and make the right decision first — then, if a website, product, or campaign is genuinely the right next step, we help you move toward it with intention.",
        },
      },
      {
        "@type": "Question",
        name: "What does 'Clarity, Decision, Progress' actually mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It's how we work. Clarity is understanding your real situation. Decision is choosing the right next step grounded in that understanding. Progress is moving deliberately, without the noise that usually derails good plans.",
        },
      },
      {
        "@type": "Question",
        name: "Do you take on every project you're offered?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Sometimes the honest recommendation is that you don't need more work right now — you need clarity, or a simpler step. We'd rather tell you that than take on work you don't need.",
        },
      },
      {
        "@type": "Question",
        name: "Who do you typically work with?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Founders, teams, and leaders at a turning point — people deciding what to build, change, or stop doing next. You don't need to arrive with a polished brief; we help you find it.",
        },
      },
      {
        "@type": "Question",
        name: "How does an engagement begin?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "With a conversation. Share your situation through the contact form, and we'll talk honestly about whether and how we can help. No pitch, no pressure.",
        },
      },
    ],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CyberWeel",
    url: "https://cyberweel.com/",
    description:
      "A progress partner. We help you see clearly, make the right decision, and move confidently toward the next stage.",
    inLanguage: "en",
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
        {children}
        <Toaster />
        <Sonner />
        <SpeedInsights />
      </body>
    </html>
  );
}
