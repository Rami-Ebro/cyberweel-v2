"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/components/site/i18n";

export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cyberweel-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", nextDark);
    setDark(nextDark);
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("cyberweel-theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  };

  const label = t.dir === "rtl"
    ? dark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"
    : dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-ink transition-colors hover:bg-muted"
    >
      {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}
