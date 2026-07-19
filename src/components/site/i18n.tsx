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
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "ar" || stored === "en") return stored;
    } catch {
      // ignore
    }
    return "ar";
  });

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
          howWeHelp: {
            ...CONTENT.en.howWeHelp,
            intro:
              "We understand the problem first, then define and execute what your business truly needs: a site, store, system, automation, cybersecurity, or improvement to what you already have.",
            areas: [
              {
                title: "Websites and digital platforms",
                text: "We design and build company sites, online stores, and service platforms that communicate value clearly and make it easier for customers to act.",
              },
              {
                title: "Business management systems",
                text: "We build systems for operations, customers, sales, inventory, and tasks around the way your business actually works.",
              },
              {
                title: "Automation and AI",
                text: "We connect tools, automate repetitive work, and apply AI where it creates practical value rather than noise.",
              },
              {
                title: "Cybersecurity and digital protection",
                text: "We assess digital risks and help protect sites, systems, accounts, and business data with practical safeguards suited to your scale.",
              },
            ],
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
