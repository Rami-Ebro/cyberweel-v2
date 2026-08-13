import { launchCopy } from "@/components/sections/launch-home-copy";

export function cyberweelPublicKnowledge() {
  return JSON.stringify({
    identity: {
      name: "CyberWeel",
      positioning: {
        ar: launchCopy.ar.hero.promise,
        en: launchCopy.en.hero.promise,
      },
      methodology: {
        ar: "وضوح ← قرار ← تقدّم",
        en: "Clarity → Decision → Progress",
      },
    },
    services: {
      ar: launchCopy.ar.areas.items.map(([title, description]) => ({ title, description })),
      en: launchCopy.en.areas.items.map(([title, description]) => ({ title, description })),
    },
    process: {
      ar: launchCopy.ar.process.items.map(([title, description]) => ({ title, description })),
      en: launchCopy.en.process.items.map(([title, description]) => ({ title, description })),
    },
    principles: {
      ar: launchCopy.ar.principles.items.map(([title, description]) => ({ title, description })),
      en: launchCopy.en.principles.items.map(([title, description]) => ({ title, description })),
    },
    faq: {
      ar: launchCopy.ar.faq.items.map(([question, answer]) => ({ question, answer })),
      en: launchCopy.en.faq.items.map(([question, answer]) => ({ question, answer })),
    },
    boundaries: {
      pricing: "No public fixed pricing is provided. Scope, price, and timing require human review.",
      promises: "Do not promise acceptance, delivery dates, outcomes, or that a team member has already responded.",
      smallestEffectiveStep: true,
    },
  });
}
