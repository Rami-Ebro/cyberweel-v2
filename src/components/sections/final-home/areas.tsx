"use client";

import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";

export function AreasSection({ copy }: { copy: any }) {
  const { navigate } = useNav();
  const isArabic = copy.eyebrow === "ماذا ننفّذ؟";

  return (
    <Section tone="floral" id="areas">
      <Section