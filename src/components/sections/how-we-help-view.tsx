"use client";

import { PageHeader } from "@/components/site/page-header";
import { ShareAction } from "@/components/site/share-action";
import { HowWeHelpAreas } from "@/components/sections/how-we-help-areas";
import { HowWeHelpDelivery } from "@/components/sections/how-we-help-delivery";
import { HowWeHelpProcess } from "@/components/sections/how-we-help-process";
import { HowWeHelpHonesty } from "@/components/sections/how-we-help-honesty";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";

export function HowWeHelpView() {
  const { navigate, view } = useNav();
  const { t } = useI18n();
  const h = t.howWeHelp;
  const rtl = t.dir === "rtl";

  return (
    <div>
      <PageHeader
        eyebrow={h.eyebrow}
        title={
          <>
            {h.titleLine1}
            <span className="mt-6 block text-accent sm:mt-7">{h.titleLine2}</span>
          </>
        }
        intro={
          rtl
            ? "نفهم المشكلة أولًا، ثم نحدّد وننفّذ ما يحتاجه مشروعك فعلًا: موقع، متجر، نظام، أتمتة، أمن سيبراني، أو تطوير لما لديك"
            : "We understand the problem first, then define and execute what your business truly needs: a site, store, system, automation, cybersecurity, or improvement to what you already have"
        }
        actions={<ShareAction view={view} />}
      />

      <HowWeHelpProcess rtl={rtl} />
      <HowWeHelpAreas rtl={rtl} areas={h.areas} />
      <HowWeHelpDelivery rtl={rtl} />
      <HowWeHelpHonesty
        eyebrow={h.honestyEyebrow}
        statement={h.honestyStatement}
        body={h.honestyBody}
        cta={rtl ? "شاركنا مشكلتك" : h.honestyCta}
        secondary={h.honestySecondary}
        onCta={() => navigate("share-challenge")}
        onAbout={() => navigate("about")}
      />
    </div>
  );
}
