"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Check, Megaphone, X } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

type PathId = "partner" | "ambassador";

const AR = {
  partner: {
    eyebrow: "دعوة لأصحاب الخبرة",
    title: "شاركنا خبرتك ونفّذ معنا مشاريع حقيقية",
    intro: "مبرمجون، مصممون، مسوقون، محللون، وخبراء تنفيذ",
    items: ["ساهم في تحويل الأفكار والمشكلات إلى حلول عملية", "اعمل ضمن نطاق واضح ومسؤوليات محددة", "احصل على فرص مناسبة لتخصصك", "ابنِ تعاونًا مستمرًا معنا عند نجاح التجربة"],
    cta: "انضم كشريك تنفيذ",
  },
  ambassador: {
    eyebrow: "مسار السفير",
    title: "كن سفيرًا لـ CyberWeel وحقق أرباحًا",
    intro: "أوصلنا إلى أصحاب الأعمال المناسبين، واحصل على عمولة واضحة عند تحوّل الفرصة إلى مشروع",
    items: ["عمولة أو مكافأة متفق عليها", "دعم في تقييم الفرص ومتابعتها", "مواد تساعدك في تقديم CyberWeel", "لوحة تحكم شفافة تحفظ حقوقك وتوضح كل فرصة وعمولتها وحالتها"],
    cta: "انضم كسفير CyberWeel",
  },
};

const EN = {
  partner: {
    eyebrow: "For experienced specialists",
    title: "Bring your expertise to meaningful client work",
    intro: "For developers, designers, marketers, analysts, and delivery specialists who value clarity, craftsmanship, and responsible execution.",
    items: [
      "Help turn real business problems into practical, well-defined solutions",
      "Work within a clear scope, with agreed responsibilities and expectations",
      "Receive opportunities that match your skills, experience, and availability",
      "Build an ongoing working relationship when the collaboration proves valuable",
    ],
    cta: "Apply as a delivery partner",
  },
  ambassador: {
    eyebrow: "The ambassador path",
    title: "Introduce the right businesses to CyberWeel",
    intro: "Connect us with suitable business owners and earn an agreed commission when a qualified opportunity becomes a project.",
    items: [
      "A clear commission or referral reward agreed in advance",
      "Support in evaluating opportunities and following them through",
      "Practical materials to help you introduce CyberWeel accurately",
      "A transparent dashboard showing each referral, its status, and the commission attached to it",
    ],
    cta: "Apply as a CyberWeel ambassador",
  },
};

function Wordmark() {
  return <span aria-label="CyberWeel" className="mx-2 inline-block h-[0.82em] w-[3.7em] bg-current align-[-0.06em]" style={{ WebkitMaskImage: "url('/cyberweel-wordmark.svg')", maskImage: "url('/cyberweel-wordmark.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />;
}

export function PartnerView() {
  const { t } = useI18n();
  const ar = t.dir === "rtl";
  const data = ar ? AR : EN;
  const [active, setActive] = useState<PathId | null>(null);

  const fields = active === "partner"
    ? [
        { kind: "text" as const, name: "name", label: ar ? "الاسم" : "Name", required: true },
        { kind: "text" as const, name: "email", label: ar ? "البريد الإلكتروني" : "Email", type: "email", required: true },
        { kind: "text" as const, name: "specialty", label: ar ? "التخصص والخبرة" : "Expertise and experience", required: true, full: true },
        { kind: "textarea" as const, name: "portfolio", label: ar ? "عرّفنا بأعمالك وتفرغك (اختياري)" : "Tell us about your work, availability, and relevant portfolio links (optional)", full: true, rows: 5 },
      ]
    : [
        { kind: "text" as const, name: "name", label: ar ? "الاسم" : "Name", required: true },
        { kind: "text" as const, name: "email", label: ar ? "البريد الإلكتروني" : "Email", type: "email", required: true },
        { kind: "text" as const, name: "market", label: ar ? "البلد أو السوق المستهدف" : "Country or target market", required: true, full: true },
        { kind: "textarea" as const, name: "network", label: ar ? "صف لنا شبكة علاقاتك وطريقة الوصول إلى الفرص (اختياري)" : "Tell us about your network and how you identify suitable opportunities (optional)", full: true, rows: 5 },
      ];

  return (
    <div>
      <PageHeader
        eyebrow={ar ? "انضم إلينا" : "Work with CyberWeel"}
        title={<>{ar ? "انضم إلى عائلة" : "Choose how you want to work with"} <Wordmark /></>}
        intro={ar ? "مساران واضحان للتعاون، اختر الطريق الذي يناسب خبرتك وطموحك" : "Two clear ways to collaborate: contribute your specialist expertise to client projects, or introduce suitable businesses through our ambassador path."}
      />

      <Section tone="muted" className="!pt-14 sm:!pt-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {(Object.keys(data) as PathId[]).map((id, index) => {
            const path = data[id];
            const Icon = index === 0 ? BriefcaseBusiness : Megaphone;
            return (
              <motion.article key={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} whileHover={{ y: -8 }} transition={{ duration: 0.35 }} className="flex flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-shadow duration-300 hover:border-camel/50 hover:shadow-xl sm:p-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-camel/10"><Icon className="h-6 w-6 text-accent" /></div>
                <p className="mt-6 text-sm font-bold text-accent">{path.eyebrow}</p>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink">{path.title}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{path.intro}</p>
                <ul className="mt-8 space-y-3">{path.items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</li>)}</ul>
                <button type="button" onClick={() => setActive(id)} className="focus-ring mt-8 inline-flex w-fit rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-floral transition hover:-translate-y-0.5 hover:bg-accent">{path.cta}</button>
              </motion.article>
            );
          })}
        </div>
      </Section>

      {active && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/70 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-accent">{data[active].eyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold text-ink">{data[active].cta}</h2></div><button type="button" onClick={() => setActive(null)} aria-label={ar ? "إغلاق" : "Close"} className="focus-ring rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>
            <MailtoForm
              to={BRAND.email}
              subject={`${active === "partner" ? (ar ? "طلب شريك تنفيذ" : "Delivery Partner Application") : (ar ? "طلب سفير CyberWeel" : "CyberWeel Ambassador Application")} — CyberWeel`}
              submitLabel={data[active].cta}
              successMessage={ar ? "وصلت رسالتك بنجاح. شارك هذه الفرصة مع شخص قد تناسبه" : "Your application is ready. We will review it carefully and contact you if the opportunity appears to be a good fit."}
              allowAttachments
              fields={fields}
            />
          </div>
        </div>
      )}
    </div>
  );
}
