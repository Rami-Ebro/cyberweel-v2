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
  // Lazy initializer: read stored lang synchronously on first client render
  // (SSR-safe: window is undefined on server, defaults to "ar").
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
  const t = lang === "ar"
    ? {
        ...CONTENT.ar,
        hero: {
          ...CONTENT.ar.hero,
          promise:
            "نساعد أصحاب الأعمال على فهم تحدياتهم الرقمية، واتخاذ القرار المناسب، وبناء الحل الذي يحتاجه مشروعهم فعلًا.",
          calmNote:
            "لا عروض جاهزة، ولا حلول عشوائية، ولا هدر للوقت والمال.",
        },
      }
    : CONTENT.en;

  // Sync <html lang> and dir attributes
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
