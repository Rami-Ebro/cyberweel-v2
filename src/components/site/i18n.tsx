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