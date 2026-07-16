"use client";

import { useNav } from "@/components/site/nav-context";
import { BRAND } from "@/lib/site-data";

export function FinalCta({ copy }: { copy: any }) {
  const { navigate } = useNav();

  return (
    <section id="share-challenge" className="cw-container py-12">
      <div className="grid overflow-hidden rounded-2xl border border-border bg-white shadow-sm lg:grid-cols-2">
        <div className="relative min-h-[260px] bg-floral lg:min-h-[420px] lg:order-2">
          <img src="/closing-image.png" alt="CyberWeel" className="h-full w-full object-cover object-left" />
        </div>
        <div className="flex flex-col items-center justify-center px-8 py-12 text-center sm:px-12 lg:px-16 lg:order-1">
          <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">{copy.title}</h2>
          <p className="mt-5 max-w-xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">{copy.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={BRAND.social.whatsapp} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-camel px-6 text-base font-semibold text-ink transition hover:bg-camel/90">
              {copy.primary}
            </a>
            <button type="button" onClick={() => navigate("share-challenge")} className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-6 text-base font-semibold text-ink transition hover:bg-bone/40">
              {copy.secondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
