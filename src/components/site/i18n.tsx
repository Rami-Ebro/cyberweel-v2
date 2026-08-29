"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import type { Lang } from "@/lib/site-data";
import { CONTENT } from "@/lib/site-data";

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (typeof CONTENT)["ar"];
  dir: "rtl" | "ltr";
};

export const I18nContext = createContext<I18nValue>({
  lang: "ar",
  setLang: () => {},
  toggleLang: () => {},
  t: CONTENT.ar,
  dir: "rtl",
});

export function useI18n() {
  return useContext(I18nContext);
}

const STORAGE_KEY = "cyberweel-lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "ar" || stored === "en") {
        void Promise.resolve().then(() => setLangState(stored));
      }
    } catch {
      // Keep the deterministic Arabic first render when storage is unavailable.
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const t =
    lang === "ar"
      ? {
          ...CONTENT.ar,
          hero: {
            ...CONTENT.ar.hero,
            promise:
              "نساعد أصحاب الأعمال على فهم تحدياتهم الرقمية، واتخاذ القرار المناسب، وبناء الحل الذي يحتاجه مشروعهم فعلًا.",
            calmNote:
              "لا عروض جاهزة، ولا حلول عشوائية، ولا هدر للوقت والمال.",
          },
          howWeHelp: {
            ...CONTENT.ar.howWeHelp,
            intro:
              "نفهم المشكلة أولًا، ثم نحدّد وننفّذ ما يحتاجه مشروعك فعلًا: موقع، متجر، نظام، أتمتة، أمن سيبراني، أو تطوير لما لديك.",
            areas: [
              {
                title: "المواقع والمنصات الرقمية",
                text: "نصمّم ونطوّر مواقع الشركات، المتاجر الإلكترونية، ومنصات الخدمات الرقمية بما يوضّح قيمة عملك ويسهّل وصول العملاء إليك.",
              },
              {
                title: "أنظمة إدارة الأعمال",
                text: "نبني أنظمة مخصّصة لإدارة العمليات، العملاء، المبيعات، المخزون، والمهام بما يتناسب مع طريقة عمل شركتك.",
              },
              {
                title: "الأتمتة والذكاء الاصطناعي",
                text: "نربط الأدوات والأنظمة، ونؤتمت المهام المتكررة، ونوظّف الذكاء الاصطناعي حيث يحقق فائدة عملية حقيقية.",
              },
              {
                title: "الأمن السيبراني وحماية الأعمال الرقمية",
                text: "نقيّم المخاطر الرقمية، ونساعدك على حماية المواقع والأنظمة والحسابات والبيانات، ووضع إجراءات تقلّل احتمالات الاختراق أو فقدان المعلومات.",
              },
            ],
          },
        }
      : {
          ...CONTENT.en,
          nav: {
            ...CONTENT.en.nav,
            partner: "Work with us",
          },
          progressPartner: "Your Partner in Progress",
          hero: {
            ...CONTENT.en.hero,
            promise:
              "We help business owners understand their digital challenges, make the right decisions, and build the solutions their businesses genuinely need.",
            calmNote:
              "No off-the-shelf pitches. No random solutions. No wasted time or budget.",
            panelLabel: "Clarity · Decision · Progress",
          },
          methodology: {
            ...CONTENT.en.methodology,
            title: "A clear, deliberate path",
            intro:
              "We do not begin with a solution. We begin by understanding the situation, choosing the right direction, and moving only when the next step is clear.",
          },
          howWeHelpTeaser: {
            ...CONTENT.en.howWeHelpTeaser,
            title: "Clear guidance, practical execution",
            intro:
              "We work alongside you to understand the real problem, choose the right response, and execute what will move the business forward.",
            cards: [
              {
                title: "Strategic clarity",
                text: "We identify the real constraint, not just the visible symptom, so decisions are grounded in what your business actually needs.",
              },
              {
                title: "The right decision",
                text: "We compare realistic options, costs, risks, and trade-offs before recommending the most sensible next step.",
              },
              {
                title: "Practical execution",
                text: "When a website, system, automation, or digital improvement is the right move, we help design and build it properly.",
              },
              {
                title: "Long-term progress",
                text: "We build for sustainable improvement, not short-lived activity that looks impressive but changes little.",
              },
            ],
          },
          philosophy: {
            ...CONTENT.en.philosophy,
            note: "Your partner in progress — not just another agency",
          },
          faq: {
            ...CONTENT.en.faq,
            title: "Straight answers to common questions",
            intro:
              "What clients usually want to know, answered clearly and without the usual agency spin.",
            items: [
              {
                q: "Is CyberWeel a digital agency?",
                a: "Not in the conventional sense. We start by understanding the problem and defining the right decision. When execution is needed, we can also design and build websites, systems, automation, and other digital solutions.",
              },
              ...CONTENT.en.faq.items.slice(1),
            ],
          },
          transition: {
            ...CONTENT.en.transition,
            eyebrow: "From where you are to what comes next",
            methodology: "Clarity · Decision · Progress",
          },
          howWeHelp: {
            ...CONTENT.en.howWeHelp,
            intro:
              "We understand the problem first, then define and execute what your business truly needs: a website, online store, management system, automation, cybersecurity support, or improvement to what you already have.",
            areasEyebrow: "What we build and improve",
            areasTitle: "Digital solutions shaped around your business",
            areasIntro:
              "These are not fixed packages. We define the right scope around your goals, operations, budget, and current stage.",
            areas: [
              {
                title: "Websites and digital platforms",
                text: "We design and build company websites, online stores, and service platforms that communicate value clearly and make it easier for customers to act.",
              },
              {
                title: "Business management systems",
                text: "We build tailored systems for operations, customer management, sales, inventory, projects, and internal workflows.",
              },
              {
                title: "Automation and AI",
                text: "We connect tools, automate repetitive work, and apply AI where it creates measurable operational value rather than noise.",
              },
              {
                title: "Cybersecurity and digital protection",
                text: "We assess digital risks and help protect websites, systems, accounts, and business data with safeguards suited to your scale.",
              },
            ],
            processTitle: "A calm, practical way of working",
            processIntro:
              "Our method turns clarity into action through four connected stages.",
            process: [
              {
                n: "01",
                title: "Listen",
                text: "We understand your current situation, constraints, goals, and what is genuinely causing friction.",
              },
              {
                n: "02",
                title: "Clarify",
                text: "We separate symptoms from causes and define the real problem worth solving.",
              },
              {
                n: "03",
                title: "Decide",
                text: "We compare the realistic options and agree on the right scope, priorities, and next step.",
              },
              {
                n: "04",
                title: "Execute",
                text: "We design, build, improve, or secure the solution with clear outcomes and measurable progress.",
              },
            ],
            honestyStatement: "Sometimes the right solution is not the one you expected",
            honestyBody: [
              "You may not need a new website, a larger system, or more marketing. You may need to fix one bottleneck, simplify a process, or improve what already exists.",
              "We will not push unnecessary work. We recommend the smallest effective move first, then build further only when it creates real value.",
            ],
          },
          shareChallenge: {
            ...CONTENT.en.shareChallenge,
            submitLabel: "Share Your Situation",
            reassurance: [
              {
                title: "A conversation, not a sales pitch",
                text: "Explain the situation in plain language. We read every message and respond personally.",
              },
              {
                title: "No pressure",
                text: "We may recommend a smaller step, improving what you already have, or waiting until the timing is right.",
              },
              {
                title: "A thoughtful response",
                text: "We respond when we have something genuinely useful to add, usually within a couple of business days.",
              },
            ],
          },
          partner: {
            ...CONTENT.en.partner,
            intro:
              "We work with marketers, specialists, designers, developers, writers, analysts, and consultants who care about clarity, strong execution, and meaningful results. If that sounds like you, we would like to hear from you.",
            formHeading: "Tell Us About Yourself",
          },
          footer: {
            ...CONTENT.en.footer,
            tagline: "From where you are… to where you want to be.",
            description:
              "We help businesses understand what is holding them back, make the right decision, and build what their next stage genuinely needs.",
            navigate: "Explore",
            stayInTouch: "Stay in touch",
            stayInTouchBody:
              "No newsletters or automated noise. Just a direct line when you have something worth discussing.",
            methodology: "Clarity · Decision · Progress",
            followUs: "Follow CyberWeel",
            shareChallenge: "Share your challenge",
          },
          commandPalette: {
            ...CONTENT.en.commandPalette,
            title: "Quick navigation",
            placeholder: "Search pages…",
            emptyTitle: "No matching page found.",
            emptyBody: "",
            pagesHeading: "Pages",
            selectHint: "Select",
            navigateHint: "Navigate",
            toSelect: "select",
            toNavigate: "navigate",
          },
          shortcuts: {
            ...CONTENT.en.shortcuts,
            title: "Keyboard shortcuts",
            subtitle: "Navigate CyberWeel without reaching for the mouse",
            items: [
              { keys: ["⌘", "K"], label: "Quick navigation", desc: "Open the page search and navigation menu" },
              { keys: ["?"], label: "Keyboard shortcuts", desc: "Open this shortcuts guide" },
              { keys: ["G", "H"], label: "Go to Home", desc: "Open the homepage" },
              { keys: ["G", "W"], label: "Go to How We Help", desc: "Review how CyberWeel assesses and delivers solutions" },
              { keys: ["G", "C"], label: "Go to Share Your Challenge", desc: "Tell us about a project, problem, or decision" },
              { keys: ["G", "P"], label: "Go to Work With Us", desc: "Explore partner and ambassador paths" },
              { keys: ["G", "A"], label: "Go to About", desc: "Learn what CyberWeel is and how we think" },
              { keys: ["G", "T"], label: "Go to Contact", desc: "Send a general message or enquiry" },
              { keys: ["Esc"], label: "Close", desc: "Close the current dialog or menu" },
            ],
            close: "Press Esc to close",
          },
          share: {
            ...CONTENT.en.share,
            label: "Share this page",
            copied: "Link copied",
            successTitle: "Link copied to your clipboard.",
            successDesc: "You can now share this page with anyone who may find it useful.",
            errorTitle: "The link could not be copied.",
            errorDesc: "Copy it directly from your browser's address bar.",
          },
          common: {
            ...CONTENT.en.common,
            skipToContent: "Skip to main content",
            noPitches: "No automated pitches. Every message is read by a person.",
            primaryCta: "Share your challenge",
            secondaryCta: "Contact us",
            requiredHint: "Fields marked with * are required.",
          },
        };

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.documentElement.dir = dir;
  }, [lang, dir, t.htmlLang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}
