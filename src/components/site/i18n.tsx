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
              "نفهم المشكلة أولًا، ثم نحدّد وننفّذ ما يحتاجه مشروعك فعلًا: موقع، متجر، نظام، هوية، تسويق، أمن سيبراني، أو تحسين للعمليات.",
            areas: [
              {
                title: "وضوح استراتيجي",
                text: "نساعدك على رؤية وضعك بصدق، وتحديد القيد الحقيقي والفرصة الفعلية وما يستحق الأولوية.",
              },
              {
                title: "مواقع ومتاجر ومنصات وأنظمة",
                text: "نبني أو نطوّر حضورك ومنتجاتك الرقمية بما يخدم عملك ويقود إلى نتيجة قابلة للقياس.",
              },
              {
                title: "الأمن السيبراني وحماية الأعمال الرقمية",
                text: "نراجع المخاطر ونقاط الضعف، ونساعدك على حماية موقعك وأنظمتك وحساباتك وبيانات عملك بحلول عملية تناسب حجم مشروعك.",
              },
              {
                title: "الهوية والتموضع والرسائل",
                text: "نوضّح كيف يجب أن يُفهم عملك، ونبني هوية ورسائل متماسكة تصمد مع النمو.",
              },
              {
                title: "النمو والتسويق ومسار العميل",
                text: "نحدّد أين يجب أن يذهب انتباهك وميزانيتك، ونحسّن الرحلة من أول تواصل حتى النتيجة.",
              },
              {
                title: "تبسيط العمليات والأتمتة",
                text: "نرتّب العمليات، نقلّل الاحتكاك، ونبني أنظمة وأتمتة تجعل العمل أوضح وأسرع وأكثر قابلية للتوسع.",
              },
            ],
          },
        }
      : {
          ...CONTENT.en,
          howWeHelp: {
            ...CONTENT.en.howWeHelp,
            intro:
              "We understand the problem first, then define and execute what your business truly needs: a site, store, system, identity, marketing, cybersecurity, or operational improvement.",
            areas: [
              {
                title: "Strategic clarity",
                text: "We help you see the real constraint, opportunity, and priority before you invest in a solution.",
              },
              {
                title: "Sites, stores, platforms and systems",
                text: "We build or improve digital products and systems that support measurable business outcomes.",
              },
              {
                title: "Cybersecurity and digital protection",
                text: "We review risks and weaknesses and help protect your site, systems, accounts, and business data with practical measures suited to your scale.",
              },
              {
                title: "Positioning, identity and messaging",
                text: "We clarify how your business should be understood and create a coherent identity and message.",
              },
              {
                title: "Growth, marketing and customer journey",
                text: "We focus attention and budget where they can improve the journey from first contact to result.",
              },
              {
                title: "Operations and automation",
                text: "We simplify workflows, reduce friction, and build systems that make the business clearer and more scalable.",
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
