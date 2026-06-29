import type { LucideIcon } from "lucide-react";
import {
  Compass,
  MessageSquareText,
  Handshake,
  Info,
  Mail,
} from "lucide-react";

export type ViewId =
  | "home"
  | "how-we-help"
  | "share-challenge"
  | "partner"
  | "about"
  | "contact";

export type Lang = "ar" | "en";

export type NavItem = {
  id: ViewId;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "home", icon: Compass },
  { id: "how-we-help", icon: Compass },
  { id: "share-challenge", icon: MessageSquareText },
  { id: "partner", icon: Handshake },
  { id: "about", icon: Info },
  { id: "contact", icon: Mail },
];

export const BRAND = {
  name: "CyberWeel",
  email: "hello@cyberweel.com",
  whatsapp: "+963982799800",
  social: {
    facebook: "https://facebook.com/cyberweel",
    telegram: "https://t.me/cyberweel",
    whatsapp: "https://wa.me/963982799800",
  },
};

/**
 * Complete bilingual content. Arabic is written first, as natural Arabic —
 * not a translation of the English. Both versions carry the same calm,
 * advisory, trustworthy tone.
 */
export const CONTENT: Record<Lang, {
  dir: "rtl" | "ltr";
  htmlLang: string;
  nav: Record<ViewId, string>;
  brandTagline: string;
  progressPartner: string;
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    promise: string;
    calmNote: string;
    primaryCta: string;
    secondaryCta: string;
    ctaNote: string;
    panelLabel: string;
  };
  methodology: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: { step: number; title: string; description: string }[];
  };
  howWeHelpTeaser: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: { title: string; text: string }[];
  };
  philosophy: {
    eyebrow: string;
    statement: string;
    body: string;
    note: string;
  };
  principles: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { title: string; text: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { q: string; a: string }[];
  };
  finalCta: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  transition: {
    eyebrow: string;
    title: string;
    body: string;
    from: string;
    to: string;
    methodology: string;
  };
  howWeHelp: {
    eyebrow: string;
    eyebrowAr: string;
    titleLine1: string;
    titleLine2: string;
    intro: string;
    areasEyebrow: string;
    areasTitle: string;
    areasIntro: string;
    areas: { title: string; text: string }[];
    processEyebrow: string;
    processTitle: string;
    processIntro: string;
    process: { n: string; title: string; text: string }[];
    honestyEyebrow: string;
    honestyStatement: string;
    honestyBody: string[];
    honestyCta: string;
    honestySecondary: string;
  };
  shareChallenge: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    intro: string;
    formHeading: string;
    formHint: string;
    fields: { name: string; label: string; placeholder?: string; required?: boolean; full?: boolean; rows?: number }[];
    submitLabel: string;
    successMessage: string;
    reassurance: { title: string; text: string }[];
    directHeading: string;
    directBody: string;
    commonEyebrow: string;
    commonTitle: string;
    commonIntro: string;
    commonQuestions: { q: string; a: string }[];
  };
  partner: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    intro: string;
    whoEyebrow: string;
    whoTitle: string;
    whoIntro: string;
    roles: string[];
    principlesEyebrow: string;
    principlesTitle: string;
    principles: { title: string; text: string }[];
    networkNote: string;
    formHeading: string;
    formHint: string;
    fields: { name: string; label: string; placeholder?: string; required?: boolean; full?: boolean; rows?: number }[];
    submitLabel: string;
    successMessage: string;
  };
  about: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    intro: string;
    philosophyEyebrow: string;
    philosophyTitle: string;
    philosophyBody1: string;
    philosophyBody2: string;
    weAre: string[];
    weAreNot: string[];
    weAreTitle: string;
    weAreNotTitle: string;
    whoWeHelpEyebrow: string;
    whoWeHelpTitle: string;
    whoWeHelpIntro: string;
    whoWeHelpBody: string;
    cta: string;
  };
  contact: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    intro: string;
    formHeading: string;
    formHint: string;
    fields: { name: string; label: string; placeholder?: string; required?: boolean; full?: boolean; rows?: number }[];
    submitLabel: string;
    successMessage: string;
    details: { title: string; text: string; value?: string; href?: string }[];
    directHeading: string;
    directBody: string;
    directCta: string;
  };
  footer: {
    tagline: string;
    description: string;
    navigate: string;
    stayInTouch: string;
    stayInTouchBody: string;
    keyboardShortcuts: string;
    shareChallenge: string;
    copyright: string;
    backToTop: string;
    methodology: string;
    followUs: string;
  };
  commandPalette: {
    title: string;
    placeholder: string;
    emptyTitle: string;
    emptyBody: string;
    pagesHeading: string;
    selectHint: string;
    navigateHint: string;
    toSelect: string;
    toNavigate: string;
  };
  shortcuts: {
    title: string;
    subtitle: string;
    items: { keys: string[]; label: string; desc: string }[];
    close: string;
  };
  share: {
    label: string;
    copied: string;
    successTitle: string;
    successDesc: string;
    errorTitle: string;
    errorDesc: string;
  };
  scrollUtilities: {
    backToTop: string;
  };
  common: {
    skipToContent: string;
    noPitches: string;
    primaryCta: string;
    secondaryCta: string;
    requiredHint: string;
  };
}> = {
  ar: {
    dir: "rtl",
    htmlLang: "ar",
    nav: {
      home: "الرئيسية",
      "how-we-help": "كيف نُساعد",
      "share-challenge": "شارك تحديك",
      partner: "شراكة",
      about: "من نحن",
      contact: "تواصل",
    },
    brandTagline: "من حيث أنت… إلى حيث تريد أن تكون.",
    progressPartner: "شريكك للتقدم",
    hero: {
      eyebrow: "سايبرويل",
      titleLine1: "من حيث أنت…",
      titleLine2: "إلى حيث تريد أن تكون",
      promise:
        "نساعد أصحاب الأعمال على فهم مشاكلهم الرقمية بوضوح، وتحويلها إلى قرارات عملية وحلول حقيقية تقودهم للمرحلة التالية.",
      calmNote:
        "نحن لا نبيع خدمات… نحن نساعدك على اتخاذ القرار الصحيح قبل أن تخسر الوقت والمال.",
      primaryCta: "ابدأ محادثة الآن",
      secondaryCta: "اعرض مشكلتك",
      ctaNote:
        "أحيانًا المشكلة ليست في مشروعك… بل في الطريقة التي تفكر بها في المشكلة.",
      panelLabel: "وضوح قرار تقدّم",
    },
    methodology: {
      eyebrow: "منهجيّتنا",
      title: "مسار بسيط ومدروس",
      intro: "لا نبدأ بالحلول. نبدأ بالفهم — ولا نتقدّم إلا حين تصبح الخطوة التالية واضحة",
      steps: [
        { step: 1, title: "وضوح", description: "نبدأ بفهم وضعك الحالي. إصغاء عميق، وتقييم صادق، بلا افتراضات مسبقة" },
        { step: 2, title: "قرار", description: "معًا نحدّد المسار. خيارات مدروسة تنبع من الفهم، لا من ردّ الفعل" },
        { step: 3, title: "تقدّم", description: "تحرّك مُقاس نحو هدفك. ثابت، ومدروس، ومستدام" },
      ],
    },
    howWeHelpTeaser: {
      eyebrow: "كيف نُساعد",
      title: "استشارة، لا معاملات",
      intro: "نعمل معك لا عليك، لنجد الخطوة التالية الصحيحة — ونكون صادقين حين تكون تلك الخطوة أصغر أو أبطأ أو مختلفة عمّا توقّعت",
      cards: [
        { title: "وضوح استراتيجي", text: "نُصغي أولًا. قبل أي توصية، نُساعدك على رؤية وضعك بصدق — القيد الحقيقي، لا الواضح فقط" },
        { title: "القرار الصائب", text: "استراتيجية تنبع من واقعك، لا من قالب جاهز. نزن الخيارات معك، لتكون الخطوة التالية موضع ثقتك" },
        { title: "تقدّم مدروس", text: "تقدّم يدوم. نُصمّم لحركة مستدامة، لا لانتصارات سريعة تزول" },
        { title: "إرشاد صادق", text: "أحيانًا يكون الجواب الصحيح أبسط ممّا توقّعت — أو أبطأ. نقول لك ما نؤمن به، حتى لو لم يكن ما رجوته" },
      ],
    },
    philosophy: {
      eyebrow: "لماذا سايبرويل",
      statement: "نحن لا نبيع الاستعجال. نحن نبني الثقة",
      body: "كل حوار ينبني على الثقة، والدقّة، والتزام مشترك بنتائج ذات معنى. نُفضّل أن نقول لك الصدق على أن نُعجبك بعرضٍ جاهز",
      note: "شريكك للتقدم — لا مجرد وكالة",
    },
    principles: {
      eyebrow: "كيف نفكّر",
      title: "مبادئ تُوجّه كل حوار",
      intro: "ليست مخطّط منهجي — بل التزامات هادئة خلف طريقة عملنا فعلًا",
      items: [
        { title: "نبدأ من السؤال الحقيقي", text: "المشكلة المُعلنة نادرًا ما تكون المشكلة الفعلية. نبدأ بإبراز ما تحاول حلّه فعلًا، ثم نعمل منه للخلف" },
        { title: "نُفضّل الخطوة الأبسط", text: "خطوة صغيرة مُختارة جيدًا كثيرًا ما تتفوّق على خطوة طموحة. نبحث عن أبسط إجراء يُحرّكك فعلًا" },
        { title: "نقول ما نعتقده فعلًا", text: "الصدق قبل المجاملات. إن كان في الخطة ثغرة، نُسمّيها. وإن كان الجواب هو الانتظار، نقول ذلك — حتى لو لم يكن مُرتجًى" },
        { title: "نُصمّم لما يدوم", text: "الانتصارات السريعة تزول. نشكّل قرارات وأنظمة تصمد بعد اللحظة الراهنة، فيتراكم التقدّم بدل أن يتبدّد" },
      ],
    },
    faq: {
      eyebrow: "أسئلة",
      title: "إجابات صريحة، قبل أن تسأل",
      intro: "ما يودّ معظم الناس معرفته — مُجابًا بصدق، بلا لغة وكالات",
      items: [
        { q: "هل سايبرويل وكالة رقمية؟", a: "ليس بالمعنى المعتاد. نحن شريكك للتقدم. نُساعدك أولًا على إدراك الوضوح واتخاذ القرار الصائب — ثم، إن كان موقع أو منتج أو حملة هو الخطوة التالية فعلًا، نُساعدك على التحرّك نحوها بنيّة." },
        { q: "ماذا يعني «وضوح، قرار، تقدّم» فعلًا؟", a: "هكذا نعمل. الوضوح هو فهم وضعك الحقيقي. القرار هو اختيار الخطوة التالية الصائبة المبنيّ على ذلك الفهم. والتقدّم هو التحرّك بنيّة، بلا الضجيج الذي يُهزّم الخطط الجيدة عادةً." },
        { q: "هل تقبلون كل مشروع يُعرَض عليكم؟", a: "لا. أحيانًا تكون التوصية الصادقة أنك لا تحتاج إلى عملٍ إضافي الآن — بل تحتاج وضوحًا، أو خطوة أبسط. نُفضّل أن نقول لك ذلك على أن نأخذ عملًا لا تحتاجه." },
        { q: "مع من تعملون عادةً؟", a: "مؤسّسون، فرق، وقادة عند نقطة تحوّل — أناس يقرّرون ماذا يبنون، أو يُغيّرون، أو يُوقفون تاليًا. لا تحتاج أن تأتي بملخّص مُصاغ؛ نُساعدك في العثور عليه." },
        { q: "كيف يبدأ التعاون؟", a: "بمحادثة. شاركنا وضعك عبر نموذج التواصل، وسنتحدّث بصدق عمّا إذا كنا نستطيع المساعدة وكيف. بلا عرض، وبلا ضغط." },
      ],
    },
    finalCta: {
      eyebrow: "لنبدأ",
      title: "هل أنت مستعدّ لرؤية الصورة بوضوح أكبر؟",
      body: "ابدأ بمحادثة. أخبرنا أين أنت — وسنُساعدك في معرفة الخطوة التالية، معًا",
      primaryCta: "شاركنا تحدّيك",
      secondaryCta: "تواصل معنا",
    },
    transition: {
      eyebrow: "من حالة إلى أخرى",
      title: "من حيث أنت… إلى حيث تريد أن تكون",
      body: "بين الوضع الحالي والمرحلة التالية مسافة تستحقّ أن تُقطع بنيّة. قوسٌ يُؤطّر الخطوة، ونورٌ يشير إلى أين تتجه — وهذا ما نُساعدك على رؤيته",
      from: "من حيث أنت",
      to: "إلى حيث تريد أن تكون",
      methodology: "وضوح قرار تقدّم",
    },
    howWeHelp: {
      eyebrow: "كيف نُساعد",
      eyebrowAr: "",
      titleLine1: "نُساعدك في إيجاد",
      titleLine2: "الخطوة التالية الصحيحة",
      intro: "لا نبيع خدماتًا من قائمة. نعمل معك — كشريكك للتقدم — لفهم وضعك، وتحديد ما يهمّ، والتحرّك نحوه بنيّة",
      areasEyebrow: "أين نُساعد",
      areasTitle: "استشارة شاملة للصورة كاملة.",
      areasIntro: "ليست باقات. بل الأماكن التي يكون فيها الوضوح أكثر قيمة عادةً. نُشكّل كلًّا منها وفق وضعك",
      areas: [
        { title: "وضوح استراتيجي", text: "قبل أي شيء، نُساعدك على رؤية وضعك بصدق. ما القيد الحقيقي؟ ما الفرصة الفعلية؟ الوضوح أولًا" },
        { title: "حضور ومنتج رقمي", text: "موقع أو منتج أو نظام يخدم رؤيتك — لا العكس. مبنيّ بنيّة، يُقاس بالنتائج" },
        { title: "الهوية والتموضع", text: "كيف يُفهَم عملك يهمّ بقدر ما تفعله. نُساعد في تشكيل هوية صادقة وواضحة تصمد مع الوقت" },
        { title: "اتجاه النمو والتسويق", text: "لا تسويق أكثر — بل التسويق الصائب. نُساعدك في تقرير أين يُحرّك الانتباه والميزانية فعليًا" },
        { title: "إرشاد العمليات والأنظمة", text: "الآلة الهادئة خلف التقدّم. نُساعدك في التبسيط، والهيكلة، وإزالة الاحتكاك الذي يُبطئك" },
        { title: "رأي ثانٍ صادق", text: "أحيانًا لا تحتاج عملًا أكثر — بل منظورًا موثوقًا. نراجع، ونُساعد، ونقول لك ماذا كنا سنفعل فعلًا" },
      ],
      processEyebrow: "كيف نعمل",
      processTitle: "إيقاع هادئ ومدروس.",
      processIntro: "منهجيّتنا في حركة — وضوح، قرار، تقدّم — مُطبّقة على كيفية تعاملنا الفعلي معك",
      process: [
        { n: "٠١", title: "إصغاء", text: "نبدأ بفهم أين أنت اليوم — سياقك، قيودك، وما تحاول حلّه فعلًا" },
        { n: "٠٢", title: "إيضاح", text: "معًا نفصل الإشارة عن الضجيج. نُبرز السؤال الحقيقي خلف السؤال الواضح" },
        { n: "٠٣", title: "قرار", text: "نعرض الخيارات الواقعية، ونزن المُقايضات، ونُساعدك في اختيار خطوة تستطيع الوقوف خلفها" },
        { n: "٠٤", title: "تحرّك", text: "ثم نتحرّك — بنيّة، بفهم واضح لما يعنيه النجاح وكيف نعرف أننا على المسار" },
      ],
      honestyEyebrow: "ملاحظة صادقة",
      honestyStatement: "أحيانًا تكون التوصية الصحيحة هي التي لم تتوقّعها",
      honestyBody: [
        "قد لا تحتاج موقعًا جديدًا الآن. قد لا تحتاج تسويقًا أكثر، أو استثمارًا أكبر، أو فريقًا أضخم. قد تحتاج وضوحًا أولًا — أو خطوة أبسط وأنفع.",
        "لن ندفعك نحو عملٍ لا تحتاجه. إن كانت الخطوة الأوضح هي التباطؤ، أو التبسيط، أو إعادة التفكير، فذلك ما سنقوله. هذا ما يعنيه أن تكون شريكك للتقدم.",
      ],
      honestyCta: "أخبرنا بوضعك",
      honestySecondary: "اقرأ منهجيّتنا",
    },
    shareChallenge: {
      eyebrow: "شارك تحدّيك",
      titleLine1: "أخبرنا أين أنت —",
      titleLine2: "سنُساعدك في رؤية الخطوة التالية",
      intro: "لا تحتاج ملخّصًا مُصاغًا. فقط صِف وضعك بصدق. سنُصغي، ومعًا نُدرك إن كنت تحتاج وضوحًا، أو قرارًا، أو خطوة محدّدة تالية",
      formHeading: "وضعك الحالي",
      formHint: "الحقول المعلّمة بـ * تُساعدنا في الردّ بمعنى. كل ما عداها اختياري",
      fields: [
        { name: "name", label: "اسمك", placeholder: "بماذا نُناديك؟", required: true },
        { name: "organization", label: "المؤسّسة (اختياري)", placeholder: "شركة، فريق، أو مشروع" },
        { name: "email", label: "البريد", placeholder: "you@example.com", required: true },
        { name: "today", label: "أين أنت اليوم؟", placeholder: "صِف وضعك الحالي — ماذا تعمل عليه، ما الذي يبدو عالقًا، ماذا جرّبت.", required: true, full: true, rows: 5 },
        { name: "figuring", label: "ماذا تحاول أن تفهم؟", placeholder: "السؤال الحقيقي خلف السؤال الواضح. القرار الذي تزنه.", full: true, rows: 4 },
        { name: "next", label: "كيف تبدو المرحلة التالية بالنسبة إليك؟", placeholder: "لو سارت الأمور جيدًا، ماذا سيكون مختلفًا بعد ستة أشهر؟", full: true, rows: 4 },
      ],
      submitLabel: "شاركنا",
      successMessage: "سينفتح برنامج بريدك برسالتك جاهزة.",
      reassurance: [
        { title: "محادثة، لا عرض بيع", text: "شاركنا ما يدور في ذهنك بلغة بسيطة. نقرأ كل رسالة ونردّ شخصيًا" },
        { title: "بلا ضغط", text: "قد نقول لك إن الخطوة الصحيحة أبسط ممّا تظن — أو أنك تحتاج وضوحًا أولًا. وهذا جيد" },
        { title: "مدروس، لا فوري", text: "نردّ حين يكون لدينا ما نقوله فعلًا — عادةً خلال أيام قليلة" },
      ],
      directHeading: "تفضّل الكتابة مباشرة؟",
      directBody: "يسعدنا أن نسمع منك على",
      commonEyebrow: "قبل أن تكتب",
      commonTitle: "أمور تستحقّ المعرفة.",
      commonIntro: "لا تحتاج أن تكون الصورة كاملة. هذه الإجابات الهادئة تغطّي ما يتساءل عنه معظم الناس قبل التواصل",
      commonQuestions: [
        { q: "هل أحتاج ملخّصًا مُصاغًا قبل التواصل؟", a: "لا. اللغة البسيطة ممتازة. أخبرنا أين أنت وما يدور في ذهنك — وسنُساعد في تشكيل السؤال معًا." },
        { q: "ماذا لو لم أكن متأكدًا أنني أحتاج شيئًا؟", a: "هذه بداية جيدة. أحيانًا يكون أنفع ما يخرج من المحادثة إدراك أن الخطوة الصحيحة هي الانتظار، أو التبسيط، أو إعادة التفكير." },
        { q: "هل ستحاولون بيع شيء لي؟", a: "لا. قد نقول لك إن العمل الذي تصوّرته ليس ما تحتاجه. دورنا أن نُساعدك في إيجاد الخطوة التالية الصحيحة — لا أن نُولّد واحدة." },
      ],
    },
    partner: {
      eyebrow: "شراكة",
      titleLine1: "تعاون مع سايبرويل —",
      titleLine2: "ابنِ تقدّمًا ذا معنى",
      intro: "نعمل مع مسوّقين، ومختصّين، ومصمّمين، ومطوّرين، وكُتّاب، ومحلّلين، ومستشارين يُؤمنون بالوضوح والحِرفة. إن بدت هذه أنت، يسعدّنا أن نعرف",
      whoEyebrow: "مع من نعمل",
      whoTitle: "مختصّون يقودون بالوضوح.",
      whoIntro: "عبر التخصّصات، أفضل من نعمل معهم يشتركون شيءًا واحدًا: يُفضّلون عملًا صادقًا مدروسًا على ملاحقة الضجيج",
      roles: ["مسوّقون", "كُتّاب", "مطوّرون", "مصمّمون", "محلّلون", "مستشارون"],
      principlesEyebrow: "كيف نشارك",
      principlesTitle: "ما نبحث عنه.",
      principles: [
        { title: "الوضوح قبل الضجيج", text: "نُقدّر التفكير الواضح والاتصال الصادق فوق كل شيء. بلا مصطلحات، بلا تكلّف" },
        { title: "احترام الحِرفة", text: "نثق بالمختصّين في ما يُحسنونه، ونبني علاقات طويلة الأمد، لا مهامّ منفردة" },
        { title: "شراكة، لا تدرّج", text: "نتعاون كأنداد حول هدف مشترك — تقدّم ذو معنى لمَن نخدمهم" },
      ],
      networkNote: "نُبقي شبكة صغيرة موثوقة. تواصل — وسنتحدّث بصدق عمّا إذا كان هناك توافق",
      formHeading: "أخبرنا عنك",
      formHint: "شاركنا خبرتك وكيف تودّ التعاون. نقرأ كل طلب",
      fields: [
        { name: "name", label: "اسمك", required: true, placeholder: "بماذا نُناديك؟" },
        { name: "email", label: "البريد", type: "email", required: true, placeholder: "you@example.com" },
        { name: "expertise", label: "خبرتك", required: true, placeholder: "مثلًا: استراتيجية علامة، تطوير كامل…" },
        { name: "link", label: "معرض أعمال / رابط (اختياري)", placeholder: "أين نرى عملك؟" },
        { name: "collaboration", label: "كيف تودّ التعاون؟", required: true, full: true, rows: 6, placeholder: "أخبرنا عن نوع العمل الذي يهمّك، وكيف تبدو الشراكة الجيدة بالنسبة إليك." },
      ],
      submitLabel: "عرّفنا بنفسك",
      successMessage: "سينفتح برنامج بريدك برسالتك جاهزة.",
    },
    about: {
      eyebrow: "من نحن",
      titleLine1: "شريكك للتقدم —",
      titleLine2: "لا مجرد وكالة رقمية",
      intro: "وُجد سايبرويل ليُساعد الأفراد والمؤسسات على التحرّك من حيث هم اليوم إلى حيث يريدون أن يكونوا غدًا. لا نبدأ بالحلول. نبدأ بالفهم",
      philosophyEyebrow: "فلسفتنا",
      philosophyTitle: "معظم المؤسسات لا تفشل من قلّة الجهد.",
      philosophyBody1: "بل تنجرف — تتصرّف بدافع الاندفاع، أو الضغط، أو الضجيج — وتفقد أين كانت تحاول الوصول فعلًا",
      philosophyBody2: "بُني سايبرويل حول فكرة مختلفة: أن التقدّم ذا المعنى يبدأ بالوضوح، ويعتمد على قرارٍ صائب، ويستمرّ بتحرّكٍ مدروس",
      weAreTitle: "ما نحن عليه",
      weAreNotTitle: "ما لسنا عليه",
      weAre: ["شريكك للتقدم", "هادئ، مدروس، وصادق", "مبنيّ على الوضوح والقرار والتقدّم", "مُرتاح لقول ما تحتاج سماعه"],
      weAreNot: ["وكالة عالية الضغط", "شركة ناشئة عابرة", "بائع تقني صاخب", "متجر قوالب جاهزة"],
      whoWeHelpEyebrow: "من نُساعد",
      whoWeHelpTitle: "أناس ومؤسسات عند نقطة تحوّل.",
      whoWeHelpIntro: "مؤسّسون يقرّرون ماذا يبنون تاليًا. فرق عالقة بين الضغط والغاية. قادة يُدركون أن الخطوة التالية تهمّ — ويريدون إصابتها",
      whoWeHelpBody: "لا نحتاج أن تأتي بملخّص مُصاغ. نُساعدك في العثور عليه. كل ما نطلبه الصدق عن وضعك والاستعداد للتفكير بوضوح معًا",
      cta: "ابدأ محادثة",
    },
    contact: {
      eyebrow: "تواصل",
      titleLine1: "لنتحدّث —",
      titleLine2: "ببساطة ومباشرة",
      intro: "بلا نماذج تحت النوافذ المنبثقة، وبلا مسار بيع. مجرد رسالة حقيقية، يقرأها إنسان حقيقي. أخبرنا بما يدور في ذهنك",
      formHeading: "أرسل رسالة",
      formHint: "شاركنا ما تودّ مناقشته. سنعود إليك",
      fields: [
        { name: "name", label: "اسمك", required: true, placeholder: "بماذا نُناديك؟" },
        { name: "email", label: "البريد", type: "email", required: true, placeholder: "you@example.com" },
        { name: "message", label: "رسالتك", required: true, full: true, rows: 7, placeholder: "أخبرنا بما يدور في ذهنك…" },
      ],
      submitLabel: "إرسال",
      successMessage: "سينفتح برنامج بريدك برسالتك جاهزة.",
      details: [
        { title: "اكتب لنا", text: "أبسط طريقة للوصول إلينا. نقرأ ونردّ شخصيًا", value: BRAND.email, href: `mailto:${BRAND.email}` },
        { title: "زمن الردّ", text: "نردّ حين يكون لدينا ما نقوله بصدق — عادةً خلال أيام قليلة" },
        { title: "نعمل عن بُعد", text: "نتعاون عبر المناطق الزمنية. الوضوح يُسافر جيدًا" },
      ],
      directHeading: "تفضّل الكتابة مباشرة؟",
      directBody: "يسعدنا أن نسمع منك على",
      directCta: "أو شاركنا تحدّيك",
    },
    footer: {
      tagline: "من حيث أنت… إلى حيث تريد أن تكون.",
      description: "شريكك للتقدم. نُساعدك على الرؤية بوضوح، واتخاذ القرار الصائب، والتحرّك بثقة نحو المرحلة التالية",
      navigate: "تصفّح",
      stayInTouch: "ابقَ على تواصل",
      stayInTouchBody: "بلا نشرات، بلا ضجيج. مجرد خطٍّ مفتوح حين تحتاجه",
      keyboardShortcuts: "اختصارات لوحة المفاتيح",
      shareChallenge: "شاركنا تحدّيك",
      copyright: "© سايبرويل. جميع الحقوق محفوظة.",
      backToTop: "العودة للأعلى",
      methodology: "وضوح قرار تقدّم",
      followUs: "تابعنا",
    },
    commandPalette: {
      title: "تنقّل سريع",
      placeholder: "انتقل إلى… (مثلًا: كيف نُساعد، تواصل)",
      emptyTitle: "لا نتائج. جرّب اسم صفحة.",
      emptyBody: "",
      pagesHeading: "الصفحات",
      selectHint: "للاختيار",
      navigateHint: "للتنقّل",
      toSelect: "للاختيار",
      toNavigate: "للتنقّل",
    },
    shortcuts: {
      title: "اختصارات لوحة المفاتيح",
      subtitle: "تنقّل عبر سايبرويل دون مغادرة لوحة المفاتيح",
      items: [
        { keys: ["⌘", "K"], label: "تنقّل سريع", desc: "افتح لوحة الأوامر للقفز إلى أي صفحة" },
        { keys: ["?"], label: "اختصارات لوحة المفاتيح", desc: "افتح نافذة المساعدة هذه" },
        { keys: ["G", "H"], label: "اذهب إلى الرئيسية", desc: "انتقل إلى الصفحة الرئيسية" },
        { keys: ["G", "W"], label: "اذهب إلى كيف نُساعد", desc: "اطّلع على كيفية عملنا معك" },
        { keys: ["G", "C"], label: "اذهب إلى شارك تحدّيك", desc: "أخبرنا بوضعك" },
        { keys: ["G", "P"], label: "اذهب إلى شراكة", desc: "تعاون مع سايبرويل" },
        { keys: ["G", "A"], label: "اذهب إلى من نحن", desc: "اقرأ منهجيّتنا" },
        { keys: ["G", "T"], label: "اذهب إلى تواصل", desc: "تواصل مباشرة" },
        { keys: ["Esc"], label: "إغلاق النافذة", desc: "أغلق أي طبقة مفتوحة" },
      ],
      close: "اضغط Esc للإغلاق",
    },
    share: {
      label: "مشاركة",
      copied: "نُسخ",
      successTitle: "نُسخ الرابط إلى الحافظة.",
      successDesc: "شاركه مع من يجد قيمة في خطوة أوضح تالية.",
      errorTitle: "تعذّر نسخ الرابط.",
      errorDesc: "انسخه يدويًا من شريط العنوان.",
    },
    scrollUtilities: {
      backToTop: "العودة للأعلى",
    },
    common: {
      skipToContent: "تخطَّ إلى المحتوى",
      noPitches: "بلا عروض. نقرأ كل رسالة شخصيًا.",
      primaryCta: "شارك تحدّيك",
      secondaryCta: "تواصل معنا",
      requiredHint: "الحقول المعلّمة بـ * تُساعدنا في الردّ بمعنى.",
    },
  },
  en: {
    dir: "ltr",
    htmlLang: "en",
    nav: {
      home: "Home",
      "how-we-help": "How We Help",
      "share-challenge": "Share Your Challenge",
      partner: "Become a Partner",
      about: "About",
      contact: "Contact",
    },
    brandTagline: "From where you are… to where you want to be.",
    progressPartner: "Progress Partner",
    hero: {
      eyebrow: "CyberWeel",
      titleLine1: "From where you are…",
      titleLine2: "to where you want to be",
      promise:
        "We help business owners understand their digital challenges clearly — and turn them into practical decisions and real solutions for the next stage.",
      calmNote:
        "We don't sell services. We help you make the right call before you lose time and money.",
      primaryCta: "Start a conversation",
      secondaryCta: "Share your challenge",
      ctaNote:
        "Sometimes the problem isn't your project — it's how you're thinking about it.",
      panelLabel: "Clarity Decision Progress",
    },
    methodology: {
      eyebrow: "Our Methodology",
      title: "A simple, deliberate path",
      intro: "We don't begin with solutions. We begin with understanding — and move forward only when the next step is clear",
      steps: [
        { step: 1, title: "Clarity", description: "We begin by understanding where you are. Deep listening, honest assessment, and no assumptions" },
        { step: 2, title: "Decision", description: "Together, we define the path forward. Strategic choices grounded in insight, not impulse" },
        { step: 3, title: "Progress", description: "Measured movement toward your goal. Consistent, deliberate, and sustainable" },
      ],
    },
    howWeHelpTeaser: {
      eyebrow: "How We Help",
      title: "Advisory, not transactions",
      intro: "We work alongside you to find the right next step — and we're honest when that step is smaller, slower, or different from what you expected",
      cards: [
        { title: "Strategic clarity", text: "We listen first. Before any recommendation, we help you see your situation honestly — the real constraint, not the obvious one" },
        { title: "The right decision", text: "Strategy grounded in your reality, not a template. We weigh trade-offs with you, so the next step is one you trust" },
        { title: "Deliberate progress", text: "Movement that lasts. We design for sustainable momentum rather than quick wins that fade" },
        { title: "Honest guidance", text: "Sometimes the right answer is simpler than expected — or slower. We tell you what we believe, even when it's not what you hoped" },
      ],
    },
    philosophy: {
      eyebrow: "Why CyberWeel",
      statement: "We don't sell urgency. We build confidence",
      body: "Every conversation is rooted in trust, precision, and a shared commitment to meaningful outcomes. We'd rather tell you the honest truth than impress you with a pitch",
      note: "A progress partner — not just an agency",
    },
    principles: {
      eyebrow: "How we think",
      title: "Principles that shape every conversation",
      intro: "Not a methodology diagram — just the quiet commitments behind how we actually work",
      items: [
        { title: "Begin with the real question", text: "The stated problem is rarely the actual one. We start by surfacing what you're genuinely trying to solve — then work backward from there" },
        { title: "Prefer the simpler step", text: "A smaller, well-chosen move often beats an ambitious one. We look for the least complicated action that genuinely moves you forward" },
        { title: "Say what we actually think", text: "Honesty over politeness. If a plan has a flaw, we name it. If the right answer is to wait, we say so — even when it's not what was hoped for" },
        { title: "Design for what lasts", text: "Quick wins fade. We shape decisions and systems that hold up beyond the immediate moment, so progress compounds instead of unraveling" },
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "Straight answers, before you ask",
      intro: "The things people usually want to know — answered honestly, without the agency spin",
      items: [
        { q: "Is CyberWeel a digital agency?", a: "Not in the usual sense. We're a progress partner. We help you find clarity and make the right decision first — then, if a website, product, or campaign is genuinely the right next step, we help you move toward it with intention." },
        { q: "What does 'Clarity, Decision, Progress' actually mean?", a: "It's how we work. Clarity is understanding your real situation. Decision is choosing the right next step grounded in that understanding. Progress is moving deliberately, without the noise that usually derails good plans." },
        { q: "Do you take on every project you're offered?", a: "No. Sometimes the honest recommendation is that you don't need more work right now — you need clarity, or a simpler step. We'd rather tell you that than take on work you don't need." },
        { q: "Who do you typically work with?", a: "Founders, teams, and leaders at a turning point — people deciding what to build, change, or stop doing next. You don't need to arrive with a polished brief; we help you find it." },
        { q: "How does an engagement begin?", a: "With a conversation. Share your situation through the contact form, and we'll talk honestly about whether and how we can help. No pitch, no pressure." },
      ],
    },
    finalCta: {
      eyebrow: "Let's begin",
      title: "Ready to see the picture more clearly?",
      body: "Start with a conversation. Tell us where you are — we'll help you figure out the next step, together",
      primaryCta: "Share your challenge",
      secondaryCta: "Get in touch",
    },
    transition: {
      eyebrow: "From one state to another",
      title: "From where you are… to where you want to be",
      body: "Between where you stand today and the next stage is a distance worth crossing with intention. An arch frames the step; a light points to where you're headed — and that's what we help you see",
      from: "From where you are",
      to: "to where you want to be",
      methodology: "Clarity Decision Progress",
    },
    howWeHelp: {
      eyebrow: "How We Help",
      eyebrowAr: "",
      titleLine1: "We help you find the",
      titleLine2: "right next step",
      intro: "We don't sell services off a menu. We work alongside you — as a progress partner — to understand your situation, define what matters, and move toward it with intention",
      areasEyebrow: "Where we can help",
      areasTitle: "Advisory across the full picture.",
      areasIntro: "These aren't packages. They're the places where clarity tends to be most valuable. We shape each one to your situation",
      areas: [
        { title: "Strategic clarity", text: "Before anything else, we help you see your situation honestly. What's the real constraint? What's the actual opportunity? Clarity comes first" },
        { title: "Digital presence & product", text: "A website, a product, or a system that serves your vision — not the other way around. Built with intention, measured by outcomes" },
        { title: "Brand & positioning", text: "How you're understood matters as much as what you do. We help shape a clear, honest identity that holds up over time" },
        { title: "Growth & marketing direction", text: "Not more marketing — the right marketing. We help you decide where attention and budget actually move you forward" },
        { title: "Operational & systems guidance", text: "The quiet machinery behind progress. We help you simplify, structure, and remove the friction that slows you down" },
        { title: "Honest second opinion", text: "Sometimes you don't need more work — you need a trusted perspective. We review, advise, and tell you what we'd actually do" },
      ],
      processEyebrow: "How we work",
      processTitle: "A calm, deliberate rhythm.",
      processIntro: "Our methodology in motion — Clarity, Decision, Progress — applied to how we actually engage with you",
      process: [
        { n: "01", title: "Listen", text: "We start by understanding where you are today — your context, your constraints, and what you're really trying to solve" },
        { n: "02", title: "Clarify", text: "Together we separate signal from noise. We surface the real question behind the obvious one" },
        { n: "03", title: "Decide", text: "We lay out the realistic options, weigh the trade-offs, and help you choose the next step you can stand behind" },
        { n: "04", title: "Move", text: "Then we move — deliberately, with a clear sense of what success looks like and how we'll know we're on track" },
      ],
      honestyEyebrow: "An honest note",
      honestyStatement: "Sometimes the right recommendation is the one you didn't expect",
      honestyBody: [
        "You may not need a new website right now. You may not need more marketing, a larger investment, or a bigger team. You may need clarity first — or a simpler, more effective step.",
        "We won't push you toward work you don't need. If the clearest next step is to slow down, simplify, or rethink, that's what we'll tell you. That's what being a progress partner means.",
      ],
      honestyCta: "Tell us your situation",
      honestySecondary: "Read our philosophy",
    },
    shareChallenge: {
      eyebrow: "Share Your Challenge",
      titleLine1: "Tell us where you are —",
      titleLine2: "we'll help you see the next step",
      intro: "You don't need a polished brief. Just describe your situation honestly. We'll listen, and together we'll figure out whether clarity, a decision, or a specific next move is what you need most",
      formHeading: "Your situation",
      formHint: "Fields marked with * help us respond meaningfully. Everything else is optional",
      fields: [
        { name: "name", label: "Your name", placeholder: "What should we call you?", required: true },
        { name: "organization", label: "Organization (optional)", placeholder: "Company, team, or project" },
        { name: "email", label: "Email", placeholder: "you@example.com", required: true },
        { name: "today", label: "Where are you today?", placeholder: "Describe your current situation — what you're working on, what feels stuck, what you've tried.", required: true, full: true, rows: 5 },
        { name: "figuring", label: "What are you trying to figure out?", placeholder: "The real question behind the obvious one. The decision you're weighing.", full: true, rows: 4 },
        { name: "next", label: "What does the next stage look like to you?", placeholder: "If things went well, what would be different in six months?", full: true, rows: 4 },
      ],
      submitLabel: "Share with us",
      successMessage: "Your email client should open with your message ready.",
      reassurance: [
        { title: "A conversation, not a pitch", text: "Share what's on your mind in plain language. We read every message and respond personally" },
        { title: "No pressure", text: "We may tell you the right step is simpler than you think — or that you need clarity first. That's fine" },
        { title: "Thoughtful, not instant", text: "We respond when we have something genuinely useful to say — usually within a couple of days" },
      ],
      directHeading: "Prefer to write directly?",
      directBody: "We're happy to hear from you at",
      commonEyebrow: "Before you write",
      commonTitle: "A few things worth knowing.",
      commonIntro: "You don't need to have it all figured out. These quiet answers cover what most people wonder before reaching out",
      commonQuestions: [
        { q: "Do I need a polished brief before reaching out?", a: "No. Plain language is perfect. Tell us where you are and what's on your mind — we'll help shape the question together." },
        { q: "What if I'm not sure I need anything yet?", a: "That's a fine place to start. Sometimes the most useful outcome of a conversation is realizing the right step is to wait, simplify, or rethink." },
        { q: "Will you try to sell me something?", a: "No. We may tell you the work you imagined isn't what you need. Our role is to help you find the right next step — not to generate one." },
      ],
    },
    partner: {
      eyebrow: "Become a Partner",
      titleLine1: "Collaborate with CyberWeel —",
      titleLine2: "build meaningful progress",
      intro: "We work with marketers, specialists, designers, developers, writers, analysts, and consultants who care about clarity and craft. If that sounds like you, we'd like to know",
      whoEyebrow: "Who we work with",
      whoTitle: "Specialists who lead with clarity.",
      whoIntro: "Across disciplines, the people we work best with share one thing: they'd rather do honest, considered work than chase noise",
      roles: ["Marketers", "Writers", "Developers", "Designers", "Analysts", "Consultants"],
      principlesEyebrow: "How we partner",
      principlesTitle: "What we look for.",
      principles: [
        { title: "Clarity over noise", text: "We value clear thinking and honest communication above all. No buzzwords, no posturing" },
        { title: "Respect for the craft", text: "We trust specialists to do what they do best, and we build long-term relationships, not one-off gigs" },
        { title: "Partnership, not hierarchy", text: "We collaborate as equals around a shared goal — meaningful progress for the people we serve" },
      ],
      networkNote: "We keep a small, trusted network. Reach out — we'll talk honestly about whether it's a fit",
      formHeading: "Tell us about you",
      formHint: "Share your expertise and how you'd like to collaborate. We read every submission",
      fields: [
        { name: "name", label: "Your name", required: true, placeholder: "What should we call you?" },
        { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
        { name: "expertise", label: "Your expertise", required: true, placeholder: "e.g. Brand strategy, full-stack development…" },
        { name: "link", label: "Portfolio / link (optional)", placeholder: "Where can we see your work?" },
        { name: "collaboration", label: "How would you like to collaborate?", required: true, full: true, rows: 6, placeholder: "Tell us about the kind of work you care about, and what a good partnership looks like to you." },
      ],
      submitLabel: "Introduce yourself",
      successMessage: "Your email client should open with your message ready.",
    },
    about: {
      eyebrow: "About CyberWeel",
      titleLine1: "A progress partner —",
      titleLine2: "not just a digital agency",
      intro: "CyberWeel exists to help people and organizations move from where they are today to where they want to be tomorrow. We don't begin with solutions. We begin with understanding",
      philosophyEyebrow: "Our philosophy",
      philosophyTitle: "Most organizations don't fail from a lack of effort.",
      philosophyBody1: "They drift — acting on impulse, pressure, or noise — and lose sight of where they were actually trying to go",
      philosophyBody2: "CyberWeel is built around a different idea: that meaningful progress begins with clarity, depends on a good decision, and is sustained by deliberate movement",
      weAreTitle: "What we are",
      weAreNotTitle: "What we're not",
      weAre: ["A progress partner", "Calm, considered, and honest", "Built around clarity, decision, and progress", "Comfortable telling you what you need to hear"],
      weAreNot: ["A high-pressure agency", "A trendy startup", "A loud tech vendor", "A template-driven shop"],
      whoWeHelpEyebrow: "Who we help",
      whoWeHelpTitle: "People and organizations at a turning point.",
      whoWeHelpIntro: "Founders deciding what to build next. Teams caught between pressure and purpose. Leaders who sense the next step matters — and want to get it right",
      whoWeHelpBody: "We don't need you to arrive with a clear brief. We help you find it. What we ask is honesty about your situation and a willingness to think clearly together",
      cta: "Start a conversation",
    },
    contact: {
      eyebrow: "Contact",
      titleLine1: "Let's talk —",
      titleLine2: "simply and directly",
      intro: "No forms buried under pop-ups, no sales funnel. Just a real message, read by a real person. Tell us what's on your mind",
      formHeading: "Send a message",
      formHint: "Share what you'd like to discuss. We'll get back to you",
      fields: [
        { name: "name", label: "Your name", required: true, placeholder: "What should we call you?" },
        { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
        { name: "message", label: "Your message", required: true, full: true, rows: 7, placeholder: "Tell us what's on your mind…" },
      ],
      submitLabel: "Send message",
      successMessage: "Your email client should open with your message ready.",
      details: [
        { title: "Write to us", text: "The simplest way to reach us. We read and respond personally", value: BRAND.email, href: `mailto:${BRAND.email}` },
        { title: "Response time", text: "We reply when we have something thoughtful to say — usually within a couple of days" },
        { title: "Working remotely", text: "We collaborate across time zones. Clarity travels well" },
      ],
      directHeading: "Prefer to write directly?",
      directBody: "We're happy to hear from you at",
      directCta: "Or share your challenge",
    },
    footer: {
      tagline: "From where you are… to where you want to be.",
      description: "A progress partner. We help you see clearly, make the right decision, and move confidently toward the next stage",
      navigate: "Navigate",
      stayInTouch: "Stay in touch",
      stayInTouchBody: "No newsletters, no noise. Just an open line when you need one",
      keyboardShortcuts: "Keyboard shortcuts",
      shareChallenge: "Share your challenge",
      copyright: "© CyberWeel. All rights reserved.",
      backToTop: "Back to top",
      methodology: "Clarity Decision Progress",
      followUs: "Follow us",
    },
    commandPalette: {
      title: "Quick navigation",
      placeholder: "Navigate to… (e.g. how we help, contact)",
      emptyTitle: "No matches. Try a page name.",
      emptyBody: "",
      pagesHeading: "Pages",
      selectHint: "to select",
      navigateHint: "to navigate",
      toSelect: "to select",
      toNavigate: "to navigate",
    },
    shortcuts: {
      title: "Keyboard shortcuts",
      subtitle: "Move through CyberWeel without leaving the keyboard",
      items: [
        { keys: ["⌘", "K"], label: "Quick navigation", desc: "Open the command palette to jump to any page" },
        { keys: ["?"], label: "Keyboard shortcuts", desc: "Open this help dialog" },
        { keys: ["G", "H"], label: "Go to Home", desc: "Navigate to the home page" },
        { keys: ["G", "W"], label: "Go to How We Help", desc: "See how CyberWeel works with you" },
        { keys: ["G", "C"], label: "Go to Share Your Challenge", desc: "Tell us about your situation" },
        { keys: ["G", "P"], label: "Go to Become a Partner", desc: "Collaborate with CyberWeel" },
        { keys: ["G", "A"], label: "Go to About", desc: "Read our philosophy" },
        { keys: ["G", "T"], label: "Go to Contact", desc: "Reach out directly" },
        { keys: ["Esc"], label: "Close dialog", desc: "Dismiss any open overlay" },
      ],
      close: "Press Esc to close",
    },
    share: {
      label: "Share",
      copied: "Copied",
      successTitle: "Link copied to clipboard.",
      successDesc: "Share it with anyone who'd value a clearer next step.",
      errorTitle: "Couldn't copy the link.",
      errorDesc: "Copy it manually from the address bar.",
    },
    scrollUtilities: {
      backToTop: "Back to top",
    },
    common: {
      skipToContent: "Skip to content",
      noPitches: "No pitches. We read every message personally.",
      primaryCta: "Share your challenge",
      secondaryCta: "Get in touch",
      requiredHint: "Fields marked with * help us respond meaningfully.",
    },
  },
};
