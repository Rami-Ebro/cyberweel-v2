"use client";

import { ShieldCheck, Clock, MessageCircle, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

export function ShareChallengeView() {
  const { view } = useNav();
  const { t } = useI18n();
  const s = t.shareChallenge;
  const isArabic = t.dir === "rtl";

  const REASSURANCE_ICONS = [MessageCircle, ShieldCheck, Clock];

  return (
    <div>
      <PageHeader
        eyebrow={isArabic ? "للمشاريع والتحديات" : "For projects and challenges"}
        title={
          <>
            {isArabic ? "لديك مشكلة أو قرار" : "Have a challenge or decision"}
            <br />
            <span className="text-accent">
              {isArabic ? "يحتاج إلى صورة أوضح؟" : "that needs a clearer picture?"}
            </span>
          </>
        }
        intro={
          isArabic
            ? "هذه الصفحة للمشاريع والتحديات الرقمية أو التشغيلية التي تحتاج إلى فهم وتحليل وتحديد الخطوة التالية قبل التنفيذ"
            : "Use this page for digital or operational projects and challenges that need diagnosis, clarity, and a well-chosen next step before execution"
        }
        actions={<ShareAction view={view} />}
      />

      <Section tone="floral" className="!pt-0">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <div className="mb-7 rounded-xl border border-camel/25 bg