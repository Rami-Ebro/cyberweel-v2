"use client";

import { Clock, Globe, Mail, MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/site-data";

type Props = { isArabic: boolean; onProject: () => void };

export function ContactSidebar({ isArabic, onProject }: Props) {
  const items = [
    { icon: Mail, title: isArabic ? "البريد الإلكتروني" : "Email", text: BRAND.email, href: `mailto:${BRAND.email}` },
    { icon: MessageCircle, title: isArabic ? "واتساب" : "WhatsApp", text: BRAND.whatsapp, href: BRAND.social.whatsapp },
    { icon: Clock, title: isArabic ? "وقت الرد" : "Response time