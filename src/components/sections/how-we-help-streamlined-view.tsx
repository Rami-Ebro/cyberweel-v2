"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading, PrimaryCta } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { ShareAction } from "@/components/site/share-action";

export function HowWeHelpStreamlinedView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={<>{h.titleLine1}<br /><span className="text-accent">{h.titleLine2}</span></>}
        intro={h.intro}
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <SectionHeading
         