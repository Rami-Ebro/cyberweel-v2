"use client";

import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ArchMotif } from "@/components/brand/motif";
import { NAV_ITEMS, BRAND, type ViewId } from "@/lib/site-data";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { SocialLinks } from "@/components/site/social-links";

const FOOTER_ITEMS = NAV_ITEMS.filter((item) => item.id !== "share-challenge");