"use client";

import { motion } from "framer-motion";
import { Check, Compass, Store, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PageHeader } from "@/components/site/page-header";
import { PrimaryCta, Section, SectionHeading } from "@/components/site/section-primitives";
import { ShareAction } from "@/components/site/share-action";
import { useI18n } from "@/components/site/i18n";
import { useNav } from "@/components/site/nav-context";

const stepsAr = [
  ["وضوح", "نبدأ بفهم وضعك الحالي من خلال الإصغاء، والتقييم الصادق، من دون افتراضات مسبقة"],
  ["قرار", "نحدّد معك المسار الأنسب، بناءً على واقع مشروعك وهدفه، لا بناءً على رد فعل متسرع"],
  ["تقدّم