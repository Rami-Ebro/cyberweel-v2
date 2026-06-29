"use client";

import { motion } from "framer-motion";
import {
  PenTool,
  Megaphone,
  Code2,
  LineChart,
  PencilRuler,
  Lightbulb,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { MailtoForm } from "@/components/site/mailto-form";
import { ShareAction } from "@/components/site/share-action";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

const ROLE_ICONS = [Megaphone, PenTool, Code2, PencilRuler, LineChart, Lightbulb];

export function PartnerView() {
  const { view } = useNav();
  const { t } = useI18n();
  const p = t.partner;

  return (
    <div>
      <PageHeader
        eyebrow={p.eyebrow}
        title={
          <>
            {p.titleLine1}
            <br />
            <span className="text-accent">{p.titleLine2}</span>
          </>
        }
        intro={p.intro}
        actions={<ShareAction view={view} />}
      />

      {/* Who we work with */}
      <Section tone="muted" className="!pt-0">
        <SectionHeading
          eyebrow={p.whoEyebrow}
          title={p.whoTitle}
          intro={p.whoIntro}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.roles.map((role, i) => {
            const Icon = ROLE_ICONS[i] ?? Users;
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-camel/40 hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-camel/10 transition-colors duration-300 group-hover:bg-camel/20">
                  <Icon className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="font-display text-lg font-medium text-ink">
                  {role}
                </span>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Principles + form */}
      <Section tone="floral">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={p.principlesEyebrow}
              title={p.principlesTitle}
            />
            <div className="mt-8 space-y-6">
              {p.principles.map((pr) => (
                <div key={pr.title} className="border-l-2 border-camel/40 ps-5">
                  <h3 className="font-display text-lg font-medium text-ink">
                    {pr.title}
                  </h3>
                  <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                    {pr.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-3 rounded-xl bg-muted/60 p-5">
              <Users className="h-5 w-5 text-accent" />
              <p className="text-base text-muted-foreground">
                {p.networkNote}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-8 sm:p-10">
            <h2 className="font-display text-2xl font-medium text-ink">
              {p.formHeading}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {p.formHint}
            </p>
            <div className="mt-8">
              <MailtoForm
                to={BRAND.email}
                subject={`${p.eyebrow} — CyberWeel`}
                submitLabel={p.submitLabel}
                successMessage={p.successMessage}
                fields={p.fields.map((f) => ({ ...f, kind: f.rows ? "textarea" : "text" }))}
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
