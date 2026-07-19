"use client";

import { motion } from "framer-motion";
import { Compass, Check, X, Store } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { FadeIn } from "@/components/site/fade-in";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

export function AboutView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const a = t.about;
  const isArabic = t.dir === "rtl";

  return (
    <div>
      <PageHeader
        eyebrow={a.eyebrow}
        title={
          <>
            {a.titleLine1}
            <br />
            <span className="text-accent">{a.titleLine2}</span>
          </>
        }
        intro