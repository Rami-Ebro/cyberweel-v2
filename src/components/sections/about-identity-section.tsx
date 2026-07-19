"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section-primitives";

type Props = {
  isArabic: boolean;
  weAreTitle: string;
  weAre: string[];
  weAreNotTitle: string;
  weAreNot: string[];
};

export function AboutIdentitySection({ isArabic, weAreTitle, weAre, weAreNotTitle, weAreNot }: Props) {
  return (
    <Section tone="ink" className="!pt-20 sm:!pt-24">
      <SectionHeading
        onDark
        align="center"
        eyebrow={isArabic ? "طريقتنا في العمل" : "How we work"}
        title={isArabic ? "ما الذي ستجده عندما تعمل معنا؟" : "What will you find when working with us?"}
       