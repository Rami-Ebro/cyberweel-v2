"use client";
import { Logo } from "@/components/brand/logo";
import { PrimaryCta, Section, SectionHeading } from "@/components/site/section-primitives";
type Props={tagline:string;eyebrow:string;title:string;intro:string;body:string;cta:string;onCta:()=>void};
export function AboutWhoWeHelpSection({tagline,eyebrow,title,intro,body,cta,onCta}:Props){return <Section tone="background" className="!bg-[#ece7da]">
<div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
<div className="flex flex-col items-start gap-6"><Logo size={64}/><p className="font-display text-lg text-ink/65">{tagline}</p></div>
<div><SectionHeading eyebrow={eyebrow} title={title} intro={intro}/><p className="mt-6 text-base leading-relaxed text-ink/70">{body}</p><div className="mt-10"><PrimaryCta onClick={onCta}>{cta}</PrimaryCta></div></div>
</div></Section>;}