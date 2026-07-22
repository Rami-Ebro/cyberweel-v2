"use client";

import { Clock, Globe, Instagram, Mail, MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/site-data";

type Props = {
  isArabic: boolean;
  onProject: () => void;
};

export function ContactSidebar({ isArabic, onProject }: Props) {
  const items = [
    {
      icon: Mail,
      title: isArabic ? "البريد الإلكتروني" : "Email",
      text: BRAND.email,
      href: `mailto:${BRAND.email}`,
    },
    {
      icon: MessageCircle,
      title: isArabic ? "واتساب" : "WhatsApp",
      text: BRAND.whatsapp,
      href: BRAND.social.whatsapp,
    },
    {
      icon: Instagram,
      title: isArabic ? "إنستغرام" : "Instagram",
      text: "@cyberweel.co",
      href: "https://www.instagram.com/cyberweel.co/",
    },
    {
      icon: Clock,
      title: isArabic ? "وقت الرد" : "Response time",
      text: isArabic ? "عادةً خلال يومي عمل" : "Usually within two business days",
    },
    {
      icon: Globe,
      title: isArabic ? "نطاق عملنا" : "Where we work",
      text: isArabic ? "نعمل مع العملاء عن بُعد" : "We work with clients remotely",
    },
  ];

  return (
    <aside className="space-y-5">
      {items.map(({ icon: Icon, title, text, href }) => {
        const card = (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-camel/10 transition-colors group-hover:bg-camel/20">
              <Icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mt-4 font-display text-lg font-medium text-ink">{title}</h3>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground group-hover:text-ink">{text}</p>
          </>
        );

        return href ? (
          <a
            key={title}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="focus-ring group block rounded-xl border border-border bg-background/75 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-camel/40 hover:bg-background hover:shadow-sm"
          >
            {card}
          </a>
        ) : (
          <div
            key={title}
            className="group rounded-xl border border-border bg-background/75 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-camel/40 hover:bg-background hover:shadow-sm"
          >
            {card}
          </div>
        );
      })}

      <div className="rounded-xl bg-ink p-7 text-floral">
        <h3 className="font-display text-2xl font-light">
          {isArabic ? "لديك مشروع أو تحدٍ؟" : "Have a project or challenge?"}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-bone/75">
          {isArabic
            ? "أخبرنا بما يعيق تقدّمك، وسنبدأ بفهم الوضع قبل اقتراح أي حل"
            : "Tell us what is blocking your progress, and we will begin by understanding the situation before proposing a solution"}
        </p>
        <button
          type="button"
          onClick={onProject}
          className="focus-ring mt-6 inline-flex rounded-md border border-camel bg-camel px-5 py-2.5 text-base font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-camel/90 hover:shadow-md"
        >
          {isArabic ? "شاركنا مشكلتك" : "Share your challenge"}
        </button>
      </div>
    </aside>
  );
}
