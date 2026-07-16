"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { ArchGateway } from "@/components/brand/motif";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

const fadeUp = {
  hidden: { opacity: