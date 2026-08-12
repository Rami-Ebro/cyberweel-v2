"use client";

import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type DashboardLang, translateDashboardText } from "@/lib/dashboard-i18n";

type DashboardI18nContextValue = {
  lang: DashboardLang;
  dir: "rtl" | "ltr";
  setLang: (lang: DashboardLang) => void;
  toggleLang: () => void;
  tr: (value: string) => string;
};

const DashboardI18nContext = createContext<DashboardI18nContextValue | null>(null);
const STORAGE_KEY = "cyberweel-lang";
const translatedText = new WeakMap<Node, { original: string; applied: string }>();
const translatedAttributes = new WeakMap<Element, Map<string, { original: string; applied: string }>>();
const attributes = ["placeholder", "aria-label", "title"];

function isDashboardPath(pathname: string) {
  return ["/admin", "/client", "/partner", "/ambassador", "/account", "/login", "/complete-profile", "/dashboard"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldSkip(node: Node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  return Boolean(element?.closest("script, style, code, pre, [data-no-dashboard-translate]"));
}

function translateTextNode(node: Node, lang: DashboardLang) {
  if (node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return;
  const current = node.nodeValue || "";
  const previous = translatedText.get(node);
  const original = !previous || current !== previous.applied ? current : previous.original;
  const desired = translateDashboardText(original, lang);
  translatedText.set(node, { original, applied: desired });
  if (current !== desired) node.nodeValue = desired;
}

function translateElement(element: Element, lang: DashboardLang) {
  if (shouldSkip(element)) return;
  const state = translatedAttributes.get(element) || new Map<string, { original: string; applied: string }>();
  for (const attribute of attributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;
    const previous = state.get(attribute);
    const original = !previous || current !== previous.applied ? current : previous.original;
    const desired = translateDashboardText(original, lang);
    state.set(attribute, { original, applied: desired });
    if (current !== desired) element.setAttribute(attribute, desired);
  }
  translatedAttributes.set(element, state);
}

function translateTree(root: Node, lang: DashboardLang) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateElement(root as Element, lang);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) translateTextNode(current, lang);
    else translateElement(current as Element, lang);
    current = walker.nextNode();
  }
}

export function useDashboardI18n() {
  const context = useContext(DashboardI18nContext);
  if (!context) throw new Error("useDashboardI18n must be used within DashboardI18nProvider");
  return context;
}

export function DashboardI18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = isDashboardPath(pathname);
  const [lang, setLangState] = useState<DashboardLang>("ar");

  useEffect(() => {
    if (!active) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") {
      void Promise.resolve().then(() => setLangState(stored));
    }
  }, [active]);

  const setLang = useCallback((next: DashboardLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLang = useCallback(() => setLang(lang === "ar" ? "en" : "ar"), [lang, setLang]);
  const tr = useCallback((value: string) => translateDashboardText(value, lang), [lang]);
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  const context = useMemo(() => ({ lang, dir, setLang, toggleLang, tr }), [dir, lang, setLang, toggleLang, tr]);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    root.dataset.dashboardLang = lang;
    translateTree(document.body, lang);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTextNode(mutation.target, lang);
        if (mutation.type === "attributes") translateElement(mutation.target as Element, lang);
        mutation.addedNodes.forEach((node) => translateTree(node, lang));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributes });
    return () => observer.disconnect();
  }, [active, dir, lang]);

  useEffect(() => {
    if (active) return;
    delete document.documentElement.dataset.dashboardLang;
  }, [active]);

  return (
    <DashboardI18nContext.Provider value={context}>
      {children}
      {active ? (
        <button
          type="button"
          onClick={toggleLang}
          data-no-dashboard-translate
          aria-label={lang === "ar" ? "Switch dashboards to English" : "Switch dashboards to Arabic"}
          className="fixed bottom-5 left-5 z-[100] inline-flex h-11 items-center gap-2 rounded-xl border border-[#D8D2C4] bg-white px-4 text-sm font-black text-[#111827] shadow-lg transition hover:border-[#B89A5A] hover:bg-[#FFFDF8]"
        >
          <Languages className="h-4 w-4 text-[#9A7D43]" />
          <span>{lang === "ar" ? "EN" : "AR"}</span>
        </button>
      ) : null}
      {active ? <style jsx global>{`
        html[data-dashboard-lang="en"] [dir="rtl"] { direction: ltr !important; }
        html[data-dashboard-lang="en"] .text-right { text-align: left !important; }
        html[data-dashboard-lang="en"] input[dir="ltr"],
        html[data-dashboard-lang="en"] a[dir="ltr"],
        html[data-dashboard-lang="en"] span[dir="ltr"],
        html[data-dashboard-lang="en"] time[dir="ltr"] { direction: ltr !important; }
      `}</style> : null}
    </DashboardI18nContext.Provider>
  );
}
