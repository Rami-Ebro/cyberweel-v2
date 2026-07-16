"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { ArchGateway } from "@/components/brand/motif";
import { Section, SectionHeading } from "@/components/site/section-primitives";
import { useNav } from "@/components/site/nav-context";
import { useI18n } from "@/components/site/i18n";
import { BRAND } from "@/lib/site-data";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LaunchHomeView() {
  const { navigate } = useNav();
  const { t } = useI18n();
  const ar = t.dir === "rtl";

  const copy = ar
    ? {
        eyebrow: "شريكك للتقدم",
        title1: "نفهم مشكلة عملك",
        title2: "ثم نبني الحل الذي تحتاجه فقط",
        promise:
          "نساعد أصحاب الأعمال على كشف الخلل الحقيقي، واتخاذ القرار الصحيح، وتحويله إلى موقع أو نظام أو هوية أو خطة قابلة للتنفيذ.",
        note: "لا عروض جاهزة، ولا حلول عشوائية، ولا هدر للوقت والمال.",
        primary: "تحدث معنا عبر واتساب",
        secondary: "أرسل تفاصيل مشكلتك",
        situationsEyebrow: "ابدأ من وضعك الحقيقي",
        situationsTitle: "أيٌّ من هذه الحالات يشبهك؟",
        situationsIntro: "لا تحتاج إلى معرفة اسم الحل قبل أن تتواصل معنا. يكفي أن تعرف ما الذي يعيقك.",
        situations: [
          { title: "لدي مشروع ولا أعرف الخطوة التالية", text: "نرتب الصورة ونحدد القرار الأكثر أولوية بدل تشتيتك بعشرات الخيارات." },
          { title: "لدي مشكلة رقمية ولا أعرف سببها", text: "نفصل الأعراض عن السبب الحقيقي قبل البدء بأي تنفيذ." },
          { title: "أحتاج موقعًا أو نظامًا لكن أخشى الاختيار الخطأ", text: "نحدد ما تحتاجه فعلًا، وما يمكنك تأجيله، وما لا يستحق أن تدفع مقابله الآن." },
        ],
        helpEyebrow: "ماذا نفعل فعليًا؟",
        helpTitle: "من المشكلة الغامضة إلى خطوة قابلة للتنفيذ",
        helpIntro: "نرافقك من الفهم إلى القرار ثم التنفيذ، دون تعقيد غير ضروري.",
        help: [
          { title: "نوضح المشكلة", text: "نحدد موضع الخلل الحقيقي والنتيجة التي تريد الوصول إليها." },
          { title: "نحدد القرار", text: "نرتب الخيارات ونختار الخطوة الأعلى أثرًا والأقل هدرًا." },
          { title: "نبني الحل", text: "موقع، نظام، هوية أو خطة نمو عندما يكون ذلك هو الحل الصحيح." },
          { title: "نرافق التنفيذ", text: "نتابع معك خطوة بخطوة حتى يصبح التقدم واضحًا وملموسًا." },
        ],
        proofEyebrow: "دليل من عملنا",
        proofTitle: "نبني أدواتنا بالطريقة نفسها التي نبني بها حلول عملائنا",
        proofBody:
          "منصة CyberWeel الحالية ليست واجهة فقط. بنينا داخلها روابط ذكية ديناميكية، رموز QR قابلة للتحديث، لوحة إدارة محمية، تتبعًا للزيارات، وقاعدة بيانات سحابية.",
        proofItems: ["حل عملي لمشكلة حقيقية", "بناء تدريجي قابل للتوسع", "حماية وتحكم من لوحة واحدة"],
        proofCta: "اعرف كيف يمكن أن نخدم مشروعك",
        methodEyebrow: "منهجيتنا",
        methodTitle: "وضوح، قرار، تقدّم",
        methodIntro: "ثلاث مراحل تمنعنا من القفز إلى التنفيذ قبل فهم ما يستحق التنفيذ.",
        method: [
          { n: "01", title: "وضوح", text: "نفهم وضعك الحالي، القيود، والفرصة الحقيقية." },
          { n: "02", title: "قرار", text: "نحدد المسار والخطوة التالية بناءً على الأولوية والأثر." },
          { n: "03", title: "تقدّم", text: "ننفذ ونقيس ونحسن حتى ترى نتيجة ملموسة." },
        ],
        finalTitle: "لست مضطرًا إلى حل كل شيء اليوم",
        finalBody: "أخبرنا بما يعيقك، وسنساعدك على تحديد أول خطوة صحيحة دون عرض مبيعات جاهز.",
      }
    : {
        eyebrow: "Your progress partner",
        title1: "We understand the problem",
        title2: "then build only what your business needs",
        promise:
          "We help business owners uncover the real bottleneck, make the right decision, and turn it into a website, system, identity, or practical growth plan.",
        note: "No canned pitches, random solutions, or wasted time and money.",
        primary: "Talk to us on WhatsApp",
        secondary: "Send your challenge details",
        situationsEyebrow: "Start from where you are",
        situationsTitle: "Which situation sounds like yours?",
        situationsIntro: "You do not need to know the solution before contacting us. You only need to know what is blocking progress.",
        situations: [
          { title: "I have a project but not a clear next step", text: "We organize the picture and identify the highest-priority decision." },
          { title: "I have a digital problem but do not know the cause", text: "We separate symptoms from the real cause before execution begins." },
          { title: "I need a website or system but fear choosing wrong", text: "We define what you truly need, what can wait, and what is not worth paying for now." },
        ],
        helpEyebrow: "What we actually do",
        helpTitle: "From an unclear problem to an actionable step",
        helpIntro: "We support you from understanding to decision and execution, without unnecessary complexity.",
        help: [
          { title: "Clarify", text: "We identify the real bottleneck and the result you need." },
          { title: "Decide", text: "We prioritize the option with the highest impact and least waste." },
          { title: "Build", text: "A website, system, identity, or growth plan when it is the right solution." },
          { title: "Support", text: "We stay with execution until progress becomes visible and measurable." },
        ],
        proofEyebrow: "Proof from our work",
        proofTitle: "We build our own tools the way we build solutions for clients",
        proofBody:
          "CyberWeel is more than a public website. It includes dynamic smart links, updateable QR codes, a protected owner dashboard, visit tracking, and a cloud database.",
        proofItems: ["A practical solution to a real need", "Incremental and scalable architecture", "Protection and control from one dashboard"],
        proofCta: "See how we can help your business",
        methodEyebrow: "Our method",
        methodTitle: "Clarity, decision, progress",
        methodIntro: "Three stages that stop us from jumping into execution before knowing what deserves to be built.",
        method: [
          { n: "01", title: "Clarity", text: "We understand your current situation, constraints, and real opportunity." },
          { n: "02", title: "Decision", text: "We define the path and next step according to priority and impact." },
          { n: "03", title: "Progress", text: "We execute, measure, and improve until the result is tangible." },
        ],
        finalTitle: "You do not have to solve everything today",
        finalBody: "Tell us what is blocking you, and we will help identify the first right step without a canned sales pitch.",
      };

  return (
    <div>
      <section className="relative overflow-hidden bg-background">
        <div className="cw-container grid items-center gap-10 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <motion.p variants={fadeUp} initial="hidden" animate="show" className="eyebrow-camel">
              {copy.eyebrow}
            </motion.p>
            <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show" className="mt-5 max-w-4xl font-display text-[2.25rem] font-light leading-[1.12] text-ink sm:text-5xl lg:text-[4.25rem]">
              <span className="block">{copy.title1}</span>
              <span className="mt-2 block text-accent">{copy.title2}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show" className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {copy.promise}
            </motion.p>
            <motion.p variants={fadeUp} custom={3} initial="hidden" animate="show" className="mt-4 flex items-center gap-2 text-base font-semibold text-ink">
              <ShieldCheck className="h-5 w-5 text-accent" />
              {copy.note}
            </motion.p>
            <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={BRAND.social.whatsapp} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-6 text-base font-semibold text-floral transition hover:bg-ink/90">
                <MessageCircle className="h-5 w-5" />
                {copy.primary}
              </a>
              <button type="button" onClick={() => navigate("share-challenge")} className="focus-ring group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-white px-6 text-base font-semibold text-ink transition hover:bg-bone/40">
                {copy.secondary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative mx-auto h-[230px] w-[230px] sm:h-[300px] sm:w-[300px] lg:h-[470px] lg:w-[470px]">
            <ArchGateway className="absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/logo-transparent.png" alt="CyberWeel" className="h-[115px] w-[115px] object-contain drop-shadow-[0_8px_24px_rgba(17,24,39,0.18)] sm:h-[150px] sm:w-[150px] lg:h-[220px] lg:w-[220px]" />
            </div>
          </motion.div>
        </div>
      </section>

      <Section tone="floral">
        <SectionHeading align="center" eyebrow={copy.situationsEyebrow} title={copy.situationsTitle} intro={copy.situationsIntro} className="mx-auto" />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {copy.situations.map((item, i) => (
            <motion.article key={item.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-xl border border-border bg-white p-7 shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <h3 className="mt-5 font-display text-2xl font-medium text-ink">{item.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading align="center" eyebrow={copy.helpEyebrow} title={copy.helpTitle} intro={copy.helpIntro} className="mx-auto" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {copy.help.map((item, i) => (
            <motion.article key={item.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-xl border border-border bg-background p-7 text-center">
              <span className="text-sm font-bold tracking-[0.2em] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 font-display text-2xl font-medium text-ink">{item.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="eyebrow-camel">{copy.proofEyebrow}</p>
            <h2 className="mt-5 max-w-3xl font-display text-3xl font-light leading-tight text-floral sm:text-5xl">{copy.proofTitle}</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-floral/75">{copy.proofBody}</p>
            <button type="button" onClick={() => navigate("how-we-help")} className="focus-ring group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-camel px-6 text-base font-semibold text-ink transition hover:bg-camel/90">
              {copy.proofCta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
          <div className="rounded-2xl border border-floral/15 bg-floral/5 p-7">
            {copy.proofItems.map((item) => (
              <div key={item} className="flex items-start gap-3 border-b border-floral/10 py-5 last:border-0">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-camel" />
                <span className="text-lg font-medium text-floral">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="floral">
        <SectionHeading align="center" eyebrow={copy.methodEyebrow} title={copy.methodTitle} intro={copy.methodIntro} className="mx-auto" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {copy.method.map((item) => (
            <article key={item.n} className="rounded-xl border border-border bg-white p-8 text-center">
              <span className="text-sm font-bold tracking-[0.2em] text-accent">{item.n}</span>
              <h3 className="mt-4 font-display text-4xl font-light text-ink">{item.title}</h3>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-light text-ink sm:text-5xl">{copy.finalTitle}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{copy.finalBody}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={BRAND.social.whatsapp} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-6 text-base font-semibold text-floral transition hover:bg-ink/90">
              <MessageCircle className="h-5 w-5" />
              {copy.primary}
            </a>
            <button type="button" onClick={() => navigate("share-challenge")} className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-6 text-base font-semibold text-ink transition hover:bg-bone/40">
              {copy.secondary}
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
