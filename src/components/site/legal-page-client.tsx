"use client";

import { ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { I18nProvider, useI18n } from "@/components/site/i18n";
import { NavContext } from "@/components/site/nav-context";
import type { ViewId } from "@/lib/site-data";
import { publicViewPath } from "@/lib/public-navigation";

type LegalBlock = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalSection = {
  id: "privacy" | "terms" | "refunds" | "cookies" | "disclaimer";
  title: string;
  intro?: string;
  blocks: LegalBlock[];
};

type LegalCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  updated: string;
  tocTitle: string;
  contactTitle: string;
  contactBody: string;
  emailLabel: string;
  note: string;
  sections: LegalSection[];
};

const AR: LegalCopy = {
  eyebrow: "السياسات والأنظمة",
  title: "سياسات CyberWeel وشروطها القانونية",
  subtitle:
    "توضح هذه الصفحة القواعد الأساسية المتعلقة باستخدام الموقع والخدمات، وحماية البيانات، والدفع والإلغاء، وملفات الارتباط، وحدود المسؤولية.",
  updated: "آخر تحديث: 26 أغسطس 2026",
  tocTitle: "انتقل إلى قسم",
  contactTitle: "التواصل القانوني والخصوصية",
  contactBody: "لأي سؤال متعلق بهذه السياسات أو بالخصوصية أو الإلغاء أو الأمور القانونية، تواصل معنا عبر البريد الإلكتروني.",
  emailLabel: "البريد الإلكتروني",
  note: "عند وجود عقد أو عرض سعر أو اتفاق خاص بمشروع معين، تكون الشروط الخاصة بذلك المشروع هي المرجع في حدود ما تنص عليه.",
  sections: [
    {
      id: "privacy",
      title: "سياسة الخصوصية",
      intro:
        "تحترم CyberWeel خصوصية الزوار والعملاء والشركاء والسفراء والمستخدمين، وتتعامل مع البيانات الشخصية بمسؤولية وبالقدر اللازم لتشغيل الخدمات وتقديمها وتحسينها وحمايتها.",
      blocks: [
        {
          heading: "1. البيانات التي قد نجمعها",
          paragraphs: [
            "قد نجمع المعلومات التي يقدمها المستخدم لنا مباشرة، مثل الاسم والبريد الإلكتروني ورقم الهاتف واسم الشركة وتفاصيل المشروع أو الطلب والرسائل والملفات والمرفقات ومعلومات الحساب.",
            "وفي الحالات المرتبطة بالفواتير أو المدفوعات أو المكافآت، قد نحتفظ بالبيانات اللازمة لتوثيق العملية، مثل القيمة والحالة والتاريخ وطريقة الدفع والمرجع أو الإثبات المرتبط بها.",
            "وقد نجمع بيانات تشغيلية وتقنية محدودة عند الحاجة، مثل عنوان IP ونوع الجهاز والمتصفح ووقت الدخول وسجلات الأخطاء أو المحاولات الأمنية ومعلومات الاستخدام المرتبطة بتشغيل الموقع وحمايته.",
          ],
        },
        {
          heading: "2. كيف نستخدم البيانات",
          paragraphs: [
            "نستخدم البيانات لتقديم خدمات CyberWeel وتشغيل الحسابات ولوحات التحكم، وإدارة المشاريع والتسليمات والفواتير والإحالات والمكافآت، والرد على الطلبات والاستفسارات، وإرسال الإشعارات المتعلقة بالخدمة.",
            "كما قد نستخدم بعض البيانات لحماية المنصة ومنع إساءة الاستخدام والاحتيال، والتحقق من العمليات، وتشخيص الأخطاء، وتحسين الأداء وتجربة المستخدم.",
            "لا نبيع البيانات الشخصية للمعلنين أو لأطراف أخرى، ولا نستخدم ملفات مشاريع العملاء لأغراض دعائية دون موافقة مناسبة.",
          ],
        },
        {
          heading: "3. الذكاء الاصطناعي",
          paragraphs: [
            "تتضمن بعض خدمات CyberWeel أدوات تعتمد على تقنيات الذكاء الاصطناعي. عند استخدام ميزة مدعومة بالذكاء الاصطناعي، قد يُرسل محتوى الرسالة ذي الصلة إلى مزود تقني لمعالجته وتوليد الرد.",
            "يُنصح بعدم إرسال كلمات المرور أو بيانات البطاقات أو الأسرار التجارية الحساسة أو أي معلومات لا تكون ضرورية للطلب.",
            "لا تحتفظ CyberWeel عمدًا بسجل كامل دائم لمحادثات الذكاء الاصطناعي لمجرد استخدام المساعد. لكن إذا طلب المستخدم مراجعة فريق CyberWeel أو أرسل بياناته للتواصل، فقد يتم حفظ البيانات الضرورية لإنشاء الطلب ومتابعته.",
          ],
        },
        {
          heading: "4. الحسابات وكلمات المرور",
          paragraphs: [
            "تُستخدم بيانات الحساب لتسجيل الدخول وتحديد صلاحيات الوصول. لا تُخزّن كلمات المرور بصورتها النصية المقروءة، ويتحمل المستخدم مسؤولية المحافظة على سرية بيانات الدخول ومنع الاستخدام غير المصرح به.",
          ],
        },
        {
          heading: "5. الملفات والمشاريع",
          paragraphs: [
            "قد يرفع العملاء أو الشركاء ملفات مرتبطة بالمشاريع أو مراحل التنفيذ أو التسليمات. تستخدم هذه الملفات لأغراض تنفيذ المشروع أو مراجعته أو تسليمه أو إدارة العلاقة المرتبطة به.",
            "قد تُخزّن الملفات عبر خدمات تخزين سحابي أو بنية تحتية تستخدمها CyberWeel. ولا يعتبر الملف المنشور داخل حساب خاص محتوى عامًا لمجرد رفعه إلى المنصة.",
          ],
        },
        {
          heading: "6. مزودو الخدمات الخارجية",
          paragraphs: [
            "قد تستعين CyberWeel بمزودي خدمات تقنيين للاستضافة وقواعد البيانات والتخزين السحابي والبريد الإلكتروني والأمان والذكاء الاصطناعي والبنية التحتية والمراقبة.",
            "تتم معالجة البيانات لدى هذه الجهات بالقدر اللازم لتنفيذ الوظيفة المطلوبة، وقد تتم المعالجة في دول أخرى غير بلد إقامة المستخدم.",
          ],
        },
        {
          heading: "7. الإفصاح عن البيانات",
          paragraphs: [
            "قد نكشف بيانات محدودة عندما يكون ذلك ضروريًا للامتثال لالتزام قانوني واجب التطبيق، أو لحماية CyberWeel أو المستخدمين أو أطراف أخرى، أو للتحقيق في احتيال أو إساءة استخدام أو تهديد أمني مشروع.",
            "ولا يتم الإفصاح عن البيانات لمجرد طلب غير موثق أو غير مشروع.",
          ],
        },
        {
          heading: "8. الاحتفاظ بالبيانات",
          paragraphs: [
            "نحتفظ بالبيانات فقط طالما كانت هناك حاجة تشغيلية أو تعاقدية أو أمنية أو محاسبية أو قانونية مشروعة. تختلف مدة الاحتفاظ بحسب نوع البيانات، وعند انتهاء الحاجة إليها يمكن حذفها أو إخفاء هويتها متى كان ذلك مناسبًا وممكنًا.",
          ],
        },
        {
          heading: "9. حقوق المستخدم",
          paragraphs: [
            "بحسب القانون المطبق، يمكن للمستخدم التواصل مع CyberWeel لطلب الاطلاع على بياناته الشخصية أو تصحيح البيانات غير الدقيقة أو طلب حذف البيانات المؤهلة للحذف أو الاستفسار عن طريقة استخدامها.",
            "قد لا يكون من الممكن حذف بعض السجلات فورًا إذا كانت هناك ضرورة قانونية أو مالية أو تعاقدية أو أمنية للاحتفاظ بها.",
          ],
        },
        {
          heading: "10. حماية البيانات",
          paragraphs: [
            "تتخذ CyberWeel إجراءات تقنية وتنظيمية معقولة لحماية البيانات من الوصول غير المصرح به أو الاستخدام أو التعديل أو الإفشاء غير المشروع. ومع ذلك، لا توجد خدمة متصلة بالإنترنت يمكن ضمان حمايتها من جميع المخاطر بنسبة 100%.",
          ],
        },
        {
          heading: "11. بيانات الأطفال",
          paragraphs: [
            "خدمات CyberWeel موجهة أساسًا للأعمال والاستخدام المهني، ولا تستهدف الأطفال بصورة مقصودة. إذا تبين لنا أن بيانات طفل قد أرسلت بصورة غير مناسبة، فيمكن اتخاذ الإجراءات المناسبة لحذفها.",
          ],
        },
        {
          heading: "12. تحديث سياسة الخصوصية",
          paragraphs: [
            "قد نحدّث هذه السياسة نتيجة تغير الخدمات أو التقنيات أو المتطلبات القانونية. عند إجراء تعديل جوهري يتم تحديث تاريخ آخر تعديل أعلى الصفحة، وقد يتم إشعار المستخدمين عند الحاجة.",
          ],
        },
      ],
    },
    {
      id: "terms",
      title: "شروط الاستخدام والخدمة",
      intro:
        "توضح هذه الشروط العلاقة الأساسية بين CyberWeel والمستخدمين أو العملاء الذين يستخدمون الموقع أو يطلبون الخدمات.",
      blocks: [
        {
          heading: "1. طبيعة خدمات CyberWeel",
          paragraphs: [
            "تقدم CyberWeel خدمات رقمية وتقنية واستشارية وتنفيذية، وقد تشمل تصميم وتطوير المواقع والأنظمة والأتمتة والذكاء الاصطناعي والأمن السيبراني والحلول التشغيلية والخدمات الرقمية المرتبطة بها.",
            "لا يعني إرسال طلب أو تعبئة نموذج أو بدء محادثة أن CyberWeel ملزمة بقبول المشروع. يصبح الاتفاق ملزمًا عندما يتم اعتماد نطاق العمل والسعر وطريقة التنفيذ أو الشروط الخاصة بالمشروع من الأطراف المعنية.",
          ],
        },
        {
          heading: "2. نطاق العمل",
          paragraphs: [
            "يتم تحديد نطاق كل مشروع أو خدمة بشكل مستقل، وقد يشمل ما سيتم تنفيذه وما لا يدخل ضمن المشروع والمراحل والتسليمات والسعر وطريقة الدفع والمتطلبات الأخرى.",
            "أي طلب يتجاوز النطاق المعتمد قد يحتاج إلى تقييم منفصل وقد يؤدي إلى تعديل السعر أو المدة أو كليهما.",
          ],
        },
        {
          heading: "3. مسؤوليات العميل",
          paragraphs: [
            "يتحمل العميل مسؤولية تقديم معلومات صحيحة وكافية تساعد على تنفيذ الخدمة، بما في ذلك البيانات والملفات والمحتوى والصور والموافقات والوصول إلى الأنظمة أو الحسابات عند الحاجة.",
            "قد يؤدي التأخر في تقديم المعلومات أو الموافقات إلى تأخر التنفيذ، ولا تتحمل CyberWeel مسؤولية التأخير الناتج عن ذلك.",
          ],
        },
        {
          heading: "4. المحتوى والحقوق التي يقدمها العميل",
          paragraphs: [
            "يؤكد العميل أن لديه الحق في استخدام وإرسال أي نصوص أو صور أو شعارات أو ملفات أو بيانات يقدمها إلى CyberWeel، ويتحمل مسؤولية قانونية المحتوى الذي يطلب نشره أو استخدامه.",
            "لا تتحمل CyberWeel مسؤولية انتهاك حقوق طرف ثالث الناتج عن مواد قدمها العميل دون امتلاك الحقوق اللازمة.",
          ],
        },
        {
          heading: "5. الأسعار والدفع",
          paragraphs: [
            "يتم تحديد سعر كل خدمة أو مشروع وفق الاتفاق المعتمد. وقد يتم الدفع كاملًا أو على دفعات أو بحسب مراحل المشروع أو وفق ترتيب آخر متفق عليه.",
            "يجوز لـ CyberWeel تعليق التنفيذ أو التسليم عند وجود دفعة مستحقة لم تُسدّد وفق الاتفاق. ولا يعتبر المشروع مدفوعًا بالكامل إلا بعد استلام كامل المبالغ المستحقة.",
          ],
        },
        {
          heading: "6. التقديرات الزمنية",
          paragraphs: [
            "أي مدة أو موعد يتم ذكره يكون مبنيًا على المعلومات المتاحة وقت التقدير، وقد يتغير بسبب تعديل النطاق أو تأخر العميل أو التعقيدات التقنية أو المتطلبات غير المعروفة أو الاعتماد على خدمات خارجية.",
            "لا يعتبر الموعد النهائي ملزمًا بشكل صارم إلا إذا تم الاتفاق عليه صراحة بهذه الصفة.",
          ],
        },
        {
          heading: "7. المراجعات والتعديلات",
          paragraphs: [
            "قد تشمل بعض المشاريع عددًا محددًا من جولات المراجعة. ولا تشمل المراجعات عادة إعادة بناء المشروع أو تغيير اتجاهه الأساسي بعد اعتماده إلا إذا تم الاتفاق على ذلك بشكل منفصل.",
            "يمكن اعتبار التغييرات الجوهرية عملًا إضافيًا خارج النطاق.",
          ],
        },
        {
          heading: "8. التسليم والقبول",
          paragraphs: [
            "قد يتم التسليم عبر لوحة العميل أو ملف أو رابط أو مستودع أو نظام أو أي وسيلة أخرى متفق عليها. ويُطلب من العميل مراجعة التسليم خلال مدة معقولة وإبلاغ CyberWeel بأي مشكلة مرتبطة بالنطاق المتفق عليه.",
            "عدم الرد لفترة طويلة بعد التسليم قد يُعامل باعتباره قبولًا عمليًا للتسليم عندما يكون ذلك مناسبًا، ما لم يوجد اتفاق ينص على خلاف ذلك.",
          ],
        },
        {
          heading: "9. الملكية الفكرية",
          paragraphs: [
            "ما لم يتم الاتفاق على خلاف ذلك، تنتقل للعميل الحقوق المتعلقة بالمخرجات النهائية المخصصة له بعد سداد كامل المستحقات.",
            "لا يشمل ذلك بالضرورة الأدوات العامة والمكتبات والأطر البرمجية والمكونات القابلة لإعادة الاستخدام والمنهجيات والتقنيات الموجودة قبل المشروع أو المطورة كأدوات عامة.",
            "يجوز لـ CyberWeel إعادة استخدام المعرفة والخبرة والمكونات العامة التي لا تحتوي على بيانات العميل السرية أو حقوقه الخاصة.",
          ],
        },
        {
          heading: "10. العرض في معرض الأعمال",
          paragraphs: [
            "ما لم يتم الاتفاق على السرية أو منع النشر، قد تعرض CyberWeel معلومات غير سرية ومحدودة عن الأعمال المنجزة ضمن معرض أعمالها أو موادها التسويقية، دون نشر بيانات حساسة أو داخلية دون إذن مناسب.",
          ],
        },
        {
          heading: "11. السرية",
          paragraphs: [
            "تتعامل CyberWeel مع المعلومات غير العامة التي يقدمها العميل على أنها معلومات مهنية خاصة، وتستخدمها بالقدر اللازم لتقديم الخدمة أو تلبية متطلبات قانونية أو تشغيلية مشروعة. ويمكن توقيع اتفاق سرية مستقل عند الحاجة.",
          ],
        },
        {
          heading: "12. الخدمات الخارجية",
          paragraphs: [
            "قد تعتمد بعض المشاريع على مزودي استضافة أو نطاقات أو قواعد بيانات أو بريد أو بوابات دفع أو ذكاء اصطناعي أو واجهات API أو تخزين سحابي. تخضع هذه الخدمات لسياسات وأسعار وشروط مزوديها، ولا تضمن CyberWeel استمرارها أو ثباتها إلى أجل غير محدد.",
          ],
        },
        {
          heading: "13. الحسابات والوصول",
          paragraphs: [
            "يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات الدخول. ولا يجوز مشاركة الحساب بما يسمح لأشخاص غير مخولين بالوصول إلى بيانات أو خدمات ليست مخصصة لهم. يجوز تعليق الوصول عند وجود نشاط أمني مشبوه أو استخدام مخالف للشروط.",
          ],
        },
        {
          heading: "14. الاستخدام غير المقبول",
          paragraphs: [
            "لا يجوز استخدام خدمات CyberWeel في نشاط غير قانوني أو احتيالي أو ضار أو لانتهاك حقوق الآخرين أو محاولة اختراق الأنظمة أو التحايل على إجراءات الحماية. ويجوز رفض أو تعليق أي خدمة تشكل خطرًا أمنيًا أو قانونيًا أو مهنيًا غير مقبول.",
          ],
        },
        {
          heading: "15. الضمانات",
          paragraphs: [
            "تبذل CyberWeel جهدًا مهنيًا معقولًا لتنفيذ الخدمات وفق النطاق المتفق عليه، لكن لا يمكن ضمان أن أي برنامج أو نظام أو خدمة رقمية ستكون خالية تمامًا من الأعطال أو الأخطاء أو الثغرات أو التوقفات.",
            "كما لا تضمن CyberWeel تحقيق نتيجة تجارية أو مالية محددة إلا إذا تم الاتفاق كتابيًا على معيار واضح وقابل للقياس.",
          ],
        },
        {
          heading: "16. حدود المسؤولية",
          paragraphs: [
            "لا تتحمل CyberWeel مسؤولية خسائر ناتجة عن معلومات غير صحيحة قدمها العميل، أو تعديلات أجراها العميل أو طرف ثالث بعد التسليم، أو توقف خدمات خارجية خارج السيطرة، أو استخدام المشروع بطريقة تخالف التعليمات أو الاتفاق.",
            "إلى الحد الذي يسمح به القانون، تكون المسؤولية مرتبطة بصورة معقولة بالخدمة محل النزاع ولا تمتد إلى خسائر غير مباشرة أو أرباح مستقبلية متوقعة بصورة غير مضمونة.",
          ],
        },
        {
          heading: "17. النسخ الاحتياطية",
          paragraphs: [
            "قد يتم الاحتفاظ بنسخ احتياطية بحسب طبيعة الخدمة والبنية المستخدمة، لكن لا ينبغي اعتبار CyberWeel خدمة أرشفة دائمة لملفات العميل ما لم يكن ذلك جزءًا صريحًا من الخدمة. ويُنصح العميل بالاحتفاظ بنسخه الخاصة من البيانات المهمة.",
          ],
        },
        {
          heading: "18. تعليق أو إنهاء الخدمة",
          paragraphs: [
            "يجوز تعليق أو إنهاء الخدمة عند عدم سداد المستحقات أو الاستخدام غير المشروع أو إساءة الاستخدام أو الإخلال الجوهري بالاتفاق أو عدم تقديم التعاون الضروري لاستمرار المشروع.",
          ],
        },
        {
          heading: "19. النزاعات والقانون الواجب التطبيق",
          paragraphs: [
            "تفضّل CyberWeel معالجة أي نزاع أولًا بالتواصل المباشر ومحاولة الوصول إلى حل عملي. يتم تحديد القانون الواجب التطبيق والجهة المختصة وفق مكان تسجيل الكيان القانوني لـ CyberWeel عند اعتماده رسميًا، أو وفق الاتفاق الخاص بالخدمة.",
          ],
        },
      ],
    },
    {
      id: "refunds",
      title: "سياسة الإلغاء والاسترداد",
      intro:
        "تختلف إمكانية الإلغاء أو الاسترداد بحسب نوع الخدمة ومرحلة التنفيذ والوقت والموارد التي تم تخصيصها للمشروع.",
      blocks: [
        {
          heading: "1. قبل بدء التنفيذ",
          paragraphs: [
            "إذا طلب العميل الإلغاء قبل بدء التنفيذ الفعلي وقبل تخصيص موارد أو شراء خدمات خارجية غير قابلة للاسترداد، يمكن إعادة المبلغ المدفوع مع خصم أي رسوم دفع أو مصاريف خارجية غير قابلة للاسترداد إن وجدت.",
            "يتم تقييم بدء التنفيذ بالاستناد إلى السجلات الفعلية للمشروع، وليس فقط إلى تاريخ الدفع.",
          ],
        },
        {
          heading: "2. بعد بدء التنفيذ",
          paragraphs: [
            "بعد بدء العمل، لا يعني إلغاء المشروع أن كامل المبلغ المدفوع يصبح قابلًا للاسترداد. يتم تحديد أي مبلغ قابل للاسترداد بناءً على العمل المنجز والوقت والموارد المخصصة والتكاليف الخارجية والالتزامات الخاصة بالمشروع.",
          ],
        },
        {
          heading: "3. الدفعات المقدمة",
          paragraphs: [
            "قد تستخدم الدفعة المقدمة لحجز وقت التنفيذ وبدء التحليل وتخصيص الموارد أو شراء خدمات لازمة للمشروع؛ لذلك لا تعتبر الدفعات المقدمة قابلة للاسترداد تلقائيًا بعد بدء التنفيذ.",
          ],
        },
        {
          heading: "4. المشاريع المقسمة إلى مراحل",
          paragraphs: [
            "في المشاريع المقسمة إلى مراحل، تعتبر كل مرحلة مكتملة ومستلمة وحدة مستقلة من العمل. لا يتم عادة رد قيمة المراحل المكتملة والمعتمدة، ويمكن تقييم المراحل التي لم يبدأ تنفيذها بشكل منفصل.",
          ],
        },
        {
          heading: "5. الخدمات المنفذة أو المسلمة",
          paragraphs: [
            "لا يكون الاسترداد متاحًا عادة للخدمات التي تم تنفيذها بالكامل وتسليمها وفق النطاق المتفق عليه. إذا كان هناك خلل حقيقي أو عدم مطابقة واضحة، يكون المسار الأول هو إصلاح المشكلة أو إعادة تنفيذ الجزء المتأثر ضمن حدود الاتفاق.",
          ],
        },
        {
          heading: "6. تغيير رأي العميل",
          paragraphs: [
            "لا يعتبر تغيير رأي العميل أو تفضيله لاتجاه مختلف بعد بدء التنفيذ سببًا تلقائيًا للاسترداد. ويمكن التعامل مع المتطلبات الجديدة باعتبارها تعديلات إضافية إذا تجاوزت النطاق المعتمد.",
          ],
        },
        {
          heading: "7. عدم تعاون العميل",
          paragraphs: [
            "إذا تعذر استمرار المشروع بسبب عدم تقديم المعلومات أو الموافقات أو المحتوى المطلوب لفترة طويلة، يجوز تعليق المشروع. وعند إنهائه يتم احتساب قيمة العمل المنجز والتكاليف الفعلية قبل تحديد أي رصيد متبقٍ.",
          ],
        },
        {
          heading: "8. التكاليف الخارجية",
          paragraphs: [
            "أي مبالغ دفعتها CyberWeel لطرف خارجي ولا يمكن استردادها منه لا تعتبر قابلة للاسترداد للعميل. قد يشمل ذلك النطاقات والاستضافة والتراخيص والاشتراكات وواجهات API وخدمات الذكاء الاصطناعي والخدمات التقنية الأخرى.",
          ],
        },
        {
          heading: "9. الإلغاء من جانب CyberWeel",
          paragraphs: [
            "إذا ألغت CyberWeel مشروعًا دون وجود إخلال من العميل، يتم احتساب العمل المنجز والتكاليف الفعلية ويعاد أي مبلغ مؤهل مقابل العمل الذي لم يتم تنفيذه. أما إذا كان الإلغاء بسبب عدم السداد أو الاستخدام غير المشروع أو إساءة الاستخدام أو إخلال جوهري، فتظل الالتزامات ذات الصلة قائمة وفق الاتفاق والعمل المنجز.",
          ],
        },
        {
          heading: "10. طلبات الاسترداد",
          paragraphs: [
            "يجب إرسال طلب الاسترداد عبر قناة التواصل الرسمية مع ذكر المشروع أو الخدمة وسبب الطلب. تتم مراجعة كل حالة بشكل منفصل وفق سجل المشروع والدفعات والعمل المنجز، ولا يعني تقديم الطلب قبوله تلقائيًا.",
          ],
        },
        {
          heading: "11. طريقة إعادة المبلغ",
          paragraphs: [
            "إذا تمت الموافقة على الاسترداد، تتم إعادة المبلغ بالطريقة المناسبة والمتاحة عمليًا للطرفين. قد تختلف المدة حسب وسيلة الدفع، وقد تخصم رسوم التحويل أو مزود الدفع إذا كانت غير قابلة للاسترداد.",
          ],
        },
        {
          heading: "12. النزاعات على المدفوعات",
          paragraphs: [
            "نطلب من العميل التواصل مع CyberWeel أولًا عند وجود اعتراض مالي لمحاولة حل المشكلة مباشرة. لا يلغي فتح نزاع مالي أو Chargeback الالتزامات المتعلقة بالعمل الذي تم تنفيذه أو الخدمات التي تم تسليمها.",
          ],
        },
        {
          heading: "13. الاتفاقات الخاصة",
          paragraphs: [
            "إذا كان عقد أو عرض سعر أو اتفاق خاص بالمشروع يتضمن شروط إلغاء أو استرداد مختلفة، تكون شروط ذلك الاتفاق هي المرجع لذلك المشروع.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "سياسة ملفات الارتباط",
      intro:
        "تستخدم CyberWeel ملفات الارتباط والتقنيات المشابهة بالقدر اللازم لتشغيل الموقع وتأمين الحسابات وتحسين تجربة الاستخدام.",
      blocks: [
        {
          heading: "1. ما هي ملفات الارتباط؟",
          paragraphs: [
            "ملفات الارتباط هي ملفات صغيرة يخزنها المتصفح على جهاز المستخدم، وقد تساعد في الحفاظ على الجلسة أو تذكر بعض التفضيلات أو تنفيذ وظائف تقنية يحتاجها الموقع.",
          ],
        },
        {
          heading: "2. كيف نستخدمها",
          bullets: [
            "الحفاظ على جلسة تسجيل الدخول.",
            "تذكر اللغة أو بعض تفضيلات المستخدم.",
            "حماية الحسابات ومنع إساءة الاستخدام.",
            "دعم وظائف الموقع ولوحات التحكم.",
            "قياس الأداء أو اكتشاف المشكلات التقنية عند استخدام أدوات تحليل مناسبة.",
          ],
        },
        {
          heading: "3. ملفات الارتباط الضرورية",
          paragraphs: [
            "بعض ملفات الارتباط ضرورية لتشغيل تسجيل الدخول والجلسات والأمان والإعدادات الأساسية. تعطيلها قد يؤدي إلى عدم عمل بعض أجزاء الموقع بصورة صحيحة.",
          ],
        },
        {
          heading: "4. التحليلات والأداء",
          paragraphs: [
            "قد تستخدم CyberWeel أدوات تحليل أو قياس أداء لفهم كيفية استخدام الموقع وتحسين السرعة وتجربة المستخدم. وعند استخدامها نحاول الحد من البيانات المجمعة إلى ما يلزم للغرض التقني أو التحليلي.",
          ],
        },
        {
          heading: "5. تقنيات الأطراف الخارجية",
          paragraphs: [
            "قد تستخدم بعض الخدمات الخارجية ملفات ارتباط أو تقنيات مشابهة وفق سياساتها الخاصة. ولا تتحكم CyberWeel مباشرة في جميع التقنيات التي تستخدمها الجهات الخارجية.",
          ],
        },
        {
          heading: "6. التحكم في ملفات الارتباط",
          paragraphs: [
            "يمكن للمستخدم حذف ملفات الارتباط أو منعها من إعدادات المتصفح، لكن تعطيل الملفات الضرورية قد يمنع تسجيل الدخول أو يؤدي إلى توقف بعض وظائف الموقع.",
          ],
        },
        {
          heading: "7. مدة الاحتفاظ",
          paragraphs: [
            "تختلف مدة بقاء ملفات الارتباط بحسب وظيفتها. قد تنتهي بعضها عند إغلاق المتصفح، بينما تبقى أخرى لفترة أطول لحفظ التفضيلات أو تنفيذ وظائف أمنية أو تشغيلية.",
          ],
        },
        {
          heading: "8. الموافقة",
          paragraphs: [
            "عندما يتطلب القانون موافقة المستخدم على ملفات ارتباط غير ضرورية، يجب الحصول على هذه الموافقة قبل تفعيلها. أما الملفات الضرورية لتشغيل الموقع أو الأمان أو تسجيل الدخول فقد تستخدم دون موافقة منفصلة عندما يسمح القانون بذلك.",
          ],
        },
      ],
    },
    {
      id: "disclaimer",
      title: "إخلاء المسؤولية",
      intro:
        "تقدم CyberWeel خدمات رقمية وتقنية واستشارية وتنفيذية تهدف إلى مساعدة العملاء والمستخدمين على بناء وتحسين حلولهم الرقمية. توضح هذه الوثيقة حدود المسؤولية المرتبطة بالموقع والخدمات والمحتوى والأدوات المقدمة.",
      blocks: [
        {
          heading: "1. المعلومات العامة",
          paragraphs: [
            "قد يتضمن موقع CyberWeel معلومات أو شروحات أو محتوى تقنيًا أو تجاريًا أو تعليميًا. يقدم هذا المحتوى لأغراض عامة، ولا يعتبر بديلًا عن استشارة قانونية أو مالية أو محاسبية أو طبية أو مهنية متخصصة عند الحاجة إليها.",
          ],
        },
        {
          heading: "2. النتائج والوعود",
          paragraphs: [
            "تعمل CyberWeel على تقديم الخدمات بمستوى مهني مناسب، لكنها لا تضمن نتائج تجارية أو مالية أو تسويقية محددة مثل زيادة الإيرادات أو الأرباح أو عدد العملاء أو الوصول إلى ترتيب معين في محركات البحث، إلا إذا تم الاتفاق كتابيًا على معيار محدد وقابل للقياس.",
          ],
        },
        {
          heading: "3. الأنظمة والبرمجيات",
          paragraphs: [
            "تخضع المواقع والأنظمة والبرمجيات والخدمات الرقمية لاحتمال ظهور أخطاء أو توقفات أو تغييرات تقنية. تبذل CyberWeel جهدًا معقولًا لاختبار الأعمال وتسليمها بصورة سليمة، لكن لا يمكن ضمان خلو أي نظام رقمي من جميع الأخطاء أو الأعطال أو الثغرات بنسبة 100%.",
          ],
        },
        {
          heading: "4. الأمن السيبراني",
          paragraphs: [
            "يمكن لـ CyberWeel اتخاذ إجراءات أمنية مناسبة وتقديم خدمات مرتبطة بالحماية والتقييم والتحسين الأمني، لكن لا يوجد نظام متصل بالإنترنت يمكن ضمان حمايته بصورة مطلقة من جميع الهجمات أو محاولات الاختراق أو الأعطال أو الأخطاء البشرية.",
            "ويظل على العميل تطبيق الممارسات الأمنية المناسبة والحفاظ على بيانات الدخول والنسخ الاحتياطية والتحديثات بحسب طبيعة النظام.",
          ],
        },
        {
          heading: "5. الذكاء الاصطناعي",
          paragraphs: [
            "قد تنتج الأنظمة المعتمدة على الذكاء الاصطناعي إجابات غير دقيقة أو ناقصة أو غير مناسبة للسياق. لذلك يجب مراجعة المخرجات قبل الاعتماد عليها في القرارات المهمة.",
            "لا ينبغي استخدام مخرجات الذكاء الاصطناعي وحدها لاتخاذ قرارات قانونية أو مالية أو طبية أو أمنية أو غيرها من القرارات عالية التأثير دون مراجعة بشرية مؤهلة.",
          ],
        },
        {
          heading: "6. الخدمات الخارجية",
          paragraphs: [
            "قد تعتمد خدمات CyberWeel أو مشاريع العملاء على خدمات تقدمها جهات خارجية. لا تتحكم CyberWeel في استمرار هذه الخدمات أو أسعارها أو سياساتها أو انقطاعاتها أو تغييراتها التقنية، ولا تتحمل مسؤولية الأعطال أو الخسائر الناتجة مباشرة عن خدمات خارجية خارجة عن سيطرتها إلا بالقدر الذي تكون فيه المشكلة مرتبطة بعمل قامت به CyberWeel نفسها.",
          ],
        },
        {
          heading: "7. الروابط الخارجية",
          paragraphs: [
            "وجود رابط إلى موقع خارجي لا يعني أن CyberWeel تضمن أو تعتمد جميع محتويات أو سياسات أو خدمات تلك الجهة. ويتحمل المستخدم مسؤولية مراجعة شروط وسياسات الخدمات الخارجية التي يختار استخدامها.",
          ],
        },
        {
          heading: "8. بيانات العميل وقراراته",
          paragraphs: [
            "تعتمد بعض الخدمات على المعلومات والمتطلبات والبيانات التي يقدمها العميل. لا تتحمل CyberWeel مسؤولية نتائج ناتجة عن معلومات خاطئة أو ناقصة أو غير محدثة قدمها العميل، ويبقى العميل مسؤولًا عن قراراته التجارية والتشغيلية والقانونية.",
          ],
        },
        {
          heading: "9. التعديلات بعد التسليم",
          paragraphs: [
            "لا تتحمل CyberWeel مسؤولية الأعطال أو المشاكل الناتجة عن تعديلات يجريها العميل أو طرف آخر على المشروع بعد التسليم خارج إشراف CyberWeel. ويمكن تقديم دعم أو إصلاح وفق اتفاق منفصل عند الحاجة.",
          ],
        },
        {
          heading: "10. استمرارية الموقع",
          paragraphs: [
            "نسعى إلى إبقاء موقع CyberWeel وخدماته متاحة بصورة مستقرة، لكن قد يحدث توقف مؤقت نتيجة الصيانة أو التحديثات أو الأعطال أو الهجمات أو مشاكل مزودي البنية التحتية. ولا يمكن ضمان التوفر دون انقطاع دائم.",
          ],
        },
        {
          heading: "11. حدود المسؤولية",
          paragraphs: [
            "إلى الحد الذي يسمح به القانون، لا تتحمل CyberWeel المسؤولية عن الخسائر غير المباشرة أو التبعية أو خسارة الأرباح المتوقعة أو الفرص التجارية الناتجة عن استخدام الخدمات. وعندما تنشأ مسؤولية مباشرة مثبتة، يتم تقييمها في حدود الخدمة محل النزاع وطبيعة الاتفاق والضرر المباشر المرتبط بها.",
          ],
        },
      ],
    },
  ],
};

const EN: LegalCopy = {
  eyebrow: "Policies & Legal",
  title: "CyberWeel Policies & Legal Terms",
  subtitle:
    "This page explains the core rules governing use of the website and services, personal information, payments and cancellations, cookies, and important limitations of liability.",
  updated: "Last updated: August 26, 2026",
  tocTitle: "Jump to a section",
  contactTitle: "Legal & Privacy Contact",
  contactBody: "For questions about these policies, privacy, cancellations, or legal matters, contact us by email.",
  emailLabel: "Email",
  note: "Where a contract, quotation, or project-specific agreement contains different terms, those specific terms govern that project to the extent stated in the agreement.",
  sections: [
    {
      id: "privacy",
      title: "Privacy Policy",
      intro:
        "CyberWeel respects the privacy of visitors, clients, partners, ambassadors, and other users. We handle personal information responsibly and only to the extent reasonably required to operate, provide, improve, and protect our services.",
      blocks: [
        {
          heading: "1. Information We May Collect",
          paragraphs: [
            "We may collect information you provide directly, including your name, email address, phone number, company or organization name, project requirements, messages, files, attachments, and account information.",
            "For invoices, payments, or rewards, we may retain information reasonably necessary to document the transaction, such as amount, status, date, payment method, reference, or related proof.",
            "We may also collect limited technical and operational information where necessary, including IP address, browser and device information, login activity, security events, error logs, and service usage information used to operate and protect the platform.",
          ],
        },
        {
          heading: "2. How We Use Information",
          paragraphs: [
            "We use information to provide CyberWeel services, operate accounts and dashboards, manage projects and deliverables, invoices, referrals and rewards, respond to requests, and send service-related notifications.",
            "We may also use information to protect the platform, prevent fraud and abuse, verify activity, diagnose technical issues, and improve performance and user experience.",
            "CyberWeel does not sell personal information to advertisers or other third parties, and client project files are not used for advertising without appropriate authorization.",
          ],
        },
        {
          heading: "3. Artificial Intelligence",
          paragraphs: [
            "Some CyberWeel services use artificial intelligence technologies. When a user interacts with an AI-powered feature, relevant message content may be sent to a technology provider for processing and response generation.",
            "Users should avoid submitting passwords, payment card information, highly confidential business information, or other sensitive information that is not necessary for the request.",
            "CyberWeel does not intentionally retain a complete permanent server-side history of AI conversations merely because the assistant was used. If a user requests CyberWeel team review or voluntarily provides contact information, information necessary to create and manage that request may be stored.",
          ],
        },
        {
          heading: "4. Accounts and Passwords",
          paragraphs: [
            "Account information is used to authenticate users and determine access permissions. Passwords are not stored as plain readable text. Users are responsible for keeping credentials confidential and preventing unauthorized account use.",
          ],
        },
        {
          heading: "5. Project Files",
          paragraphs: [
            "Clients and partners may upload files relating to projects, implementation stages, reviews, or deliverables. These files are used only for purposes reasonably connected with performing, reviewing, managing, or delivering the applicable service.",
            "Files may be stored through cloud infrastructure or storage providers used by CyberWeel. Uploading a file to a private CyberWeel account does not make that file public.",
          ],
        },
        {
          heading: "6. Third-Party Service Providers",
          paragraphs: [
            "CyberWeel may use external technology providers for hosting, databases, cloud storage, email delivery, security, artificial intelligence, infrastructure, and monitoring. Information should be processed by those providers only to the extent reasonably required for the relevant function.",
            "Some providers may process information in countries other than the user's country of residence.",
          ],
        },
        {
          heading: "7. Disclosure of Information",
          paragraphs: [
            "We may disclose limited information where reasonably necessary to comply with an applicable legal obligation, protect CyberWeel or other parties, investigate fraud or abuse, or respond to a legitimate security threat.",
            "We do not disclose information merely in response to an undocumented or unlawful request.",
          ],
        },
        {
          heading: "8. Data Retention",
          paragraphs: [
            "Information is retained only for as long as reasonably required for legitimate operational, contractual, security, accounting, or legal purposes. Retention periods vary by data type. When information is no longer required, it may be deleted, anonymized, or otherwise handled appropriately.",
          ],
        },
        {
          heading: "9. User Rights",
          paragraphs: [
            "Subject to applicable law, users may contact CyberWeel to request access to personal information, correction of inaccurate information, deletion of eligible information, or information about how their data is used.",
            "Some information may need to be retained for legal, financial, contractual, or security reasons.",
          ],
        },
        {
          heading: "10. Security",
          paragraphs: [
            "CyberWeel uses reasonable technical and organizational safeguards designed to protect information against unauthorized access, misuse, modification, or disclosure. No internet-connected service can guarantee absolute security.",
          ],
        },
        {
          heading: "11. Children",
          paragraphs: [
            "CyberWeel primarily provides professional and business-oriented services and does not intentionally target children. If we become aware that a child's personal information has been improperly submitted, we may take appropriate steps to remove it.",
          ],
        },
        {
          heading: "12. Changes to This Policy",
          paragraphs: [
            "This Privacy Policy may be updated as our services, technologies, or legal requirements change. The date shown at the top of this page will be updated when material changes are made, and users may be notified where appropriate.",
          ],
        },
      ],
    },
    {
      id: "terms",
      title: "Terms of Use & Service",
      intro:
        "These Terms explain the basic relationship between CyberWeel and users or clients who use the website or request services.",
      blocks: [
        {
          heading: "1. Nature of Our Services",
          paragraphs: [
            "CyberWeel provides digital, technical, consulting, and implementation services. Services may include website and software development, digital systems, automation, artificial intelligence, cybersecurity, operational solutions, technical consulting, and related digital services.",
            "Submitting a form, sending a message, or requesting information does not automatically require CyberWeel to accept a project. A project becomes binding when the relevant scope, price, implementation terms, or other project conditions are accepted by the applicable parties.",
          ],
        },
        {
          heading: "2. Scope of Work",
          paragraphs: [
            "Each project or service has its own scope, which may define work to be performed, exclusions, project stages, deliverables, pricing, payment arrangements, and project requirements.",
            "Requests outside the agreed scope may require separate evaluation and may affect pricing, delivery time, or both.",
          ],
        },
        {
          heading: "3. Client Responsibilities",
          paragraphs: [
            "Clients are responsible for providing accurate and sufficient information required for the project, including data, files, content, images, approvals, and access to systems or accounts where appropriate.",
            "Delays caused by missing information, late approvals, or incomplete cooperation may result in project delays for which CyberWeel is not responsible.",
          ],
        },
        {
          heading: "4. Client Content and Rights",
          paragraphs: [
            "Clients confirm that they have the necessary rights to provide and authorize the use of text, images, logos, files, data, or other materials supplied to CyberWeel, and remain responsible for the legality of content they ask us to publish or use.",
            "CyberWeel is not responsible for third-party rights violations caused by materials supplied without appropriate authorization by the client.",
          ],
        },
        {
          heading: "5. Pricing and Payment",
          paragraphs: [
            "Pricing is determined according to the applicable project or service agreement. Payment may be full, installment-based, milestone-based, or otherwise agreed.",
            "CyberWeel may pause performance or withhold delivery where an agreed payment remains overdue. A project is not considered fully paid until all applicable amounts have been received.",
          ],
        },
        {
          heading: "6. Timelines",
          paragraphs: [
            "Any estimated timeline is based on information available when the estimate is made and may change because of scope changes, delayed client responses, technical complications, previously unknown requirements, or external service dependencies.",
            "A deadline should only be considered strictly binding where it has been expressly agreed as such.",
          ],
        },
        {
          heading: "7. Revisions",
          paragraphs: [
            "Some projects may include an agreed number of revision rounds. Revisions generally do not include a full redesign, rebuild, or fundamental change in direction after prior approval unless separately agreed.",
            "Major changes may be treated as additional work outside the agreed scope.",
          ],
        },
        {
          heading: "8. Delivery and Acceptance",
          paragraphs: [
            "Deliverables may be provided through a client dashboard, file, link, repository, technical system, or another agreed delivery method. Clients should review deliverables within a reasonable period and report any issue relating to the agreed scope.",
            "Extended inactivity following delivery may be treated as practical acceptance where appropriate, unless otherwise agreed.",
          ],
        },
        {
          heading: "9. Intellectual Property",
          paragraphs: [
            "Unless otherwise agreed, rights to final custom deliverables intended specifically for the client transfer after full payment of the applicable fees.",
            "This does not necessarily include pre-existing technology, general-purpose libraries, frameworks, reusable components, development tools, internal methods, or general technical knowledge.",
            "CyberWeel may reuse general knowledge and components that do not contain the client's confidential information or proprietary data.",
          ],
        },
        {
          heading: "10. Portfolio Use",
          paragraphs: [
            "Unless confidentiality or another restriction has been agreed, CyberWeel may display limited non-confidential information about completed work in its portfolio or marketing materials. Sensitive or internal client information will not intentionally be disclosed without appropriate permission.",
          ],
        },
        {
          heading: "11. Confidentiality",
          paragraphs: [
            "CyberWeel treats non-public client information as professional confidential information and uses it only as reasonably necessary to provide the service or meet legitimate legal or operational requirements. A separate confidentiality agreement may be used where needed.",
          ],
        },
        {
          heading: "12. Third-Party Services",
          paragraphs: [
            "Projects may depend on hosting companies, domain registrars, database providers, email services, payment providers, AI providers, APIs, cloud storage, and other external services. These providers operate under their own pricing, policies, terms, and availability, and CyberWeel cannot guarantee that they will remain unchanged or continuously available.",
          ],
        },
        {
          heading: "13. Accounts and Access",
          paragraphs: [
            "Users are responsible for keeping login credentials confidential. Accounts must not be shared in a way that allows unauthorized people to access data or services. CyberWeel may suspend access where suspicious security activity or use contrary to these Terms is detected.",
          ],
        },
        {
          heading: "14. Acceptable Use",
          paragraphs: [
            "CyberWeel services must not be used for illegal, fraudulent, abusive, harmful, or rights-infringing activities, attempts to compromise systems, or circumvention of security controls. Services may be refused or suspended where use creates an unacceptable legal, security, or professional risk.",
          ],
        },
        {
          heading: "15. Warranties",
          paragraphs: [
            "CyberWeel aims to provide services with reasonable professional care. No software, website, or digital system can be guaranteed to be entirely free from bugs, interruptions, vulnerabilities, or technical failures.",
            "CyberWeel does not guarantee specific business or financial results unless a specific measurable commitment has been expressly agreed in writing.",
          ],
        },
        {
          heading: "16. Limitation of Liability",
          paragraphs: [
            "CyberWeel is not responsible for losses resulting from incorrect information supplied by a client, unauthorized or improper changes made after delivery, third-party service failures outside our control, or use of a solution contrary to instructions or the applicable agreement.",
            "To the extent permitted by applicable law, liability should remain reasonably related to the service giving rise to the claim and should not extend to speculative or indirect future losses.",
          ],
        },
        {
          heading: "17. Backups",
          paragraphs: [
            "Backups may be retained depending on the nature of the service and infrastructure used. CyberWeel should not be treated as a permanent archival service unless that is expressly included in the service. Clients are encouraged to keep their own copies of important data and files.",
          ],
        },
        {
          heading: "18. Suspension or Termination",
          paragraphs: [
            "CyberWeel may suspend or terminate a service because of non-payment, illegal use, abuse of the platform, significant breach of the applicable agreement, or failure to provide cooperation required to continue the project.",
          ],
        },
        {
          heading: "19. Governing Law and Disputes",
          paragraphs: [
            "CyberWeel prefers to resolve disputes first through direct communication and a reasonable attempt to reach a practical solution. The applicable governing law and competent jurisdiction will be specified once CyberWeel's legal entity and jurisdiction have been formally established, or may be defined in an individual project agreement.",
          ],
        },
      ],
    },
    {
      id: "refunds",
      title: "Cancellation & Refund Policy",
      intro:
        "Eligibility for cancellation or refund depends on the type of service, the project stage, work already completed, and costs and resources already committed.",
      blocks: [
        {
          heading: "1. Before Work Begins",
          paragraphs: [
            "If a client cancels before substantive work begins and before project-specific resources or non-refundable external services have been purchased, amounts paid may be eligible for refund, less non-refundable transaction charges or external costs where applicable.",
            "Whether work has started is assessed by reference to actual project records, not solely by payment date.",
          ],
        },
        {
          heading: "2. After Work Has Started",
          paragraphs: [
            "Once work has started, cancellation does not automatically make the full amount paid refundable. Any potential refund may take into account completed work, time spent, resources allocated, external costs, services already purchased, and project-specific commitments.",
          ],
        },
        {
          heading: "3. Advance Payments",
          paragraphs: [
            "An advance payment may reserve implementation capacity, begin analysis, allocate resources, or purchase services required for the project. Advance payments are therefore not automatically refundable after work begins.",
          ],
        },
        {
          heading: "4. Milestone-Based Projects",
          paragraphs: [
            "Where a project is divided into stages, each completed and accepted stage may be treated as a separate unit of work. Amounts paid for completed stages are generally not refundable, while stages that have not begun may be assessed separately.",
          ],
        },
        {
          heading: "5. Completed or Delivered Services",
          paragraphs: [
            "Refunds are generally not available for services completed and delivered according to the agreed scope. Where a genuine defect or material scope discrepancy exists, the preferred first remedy is correction of the affected work within the agreed scope.",
          ],
        },
        {
          heading: "6. Change of Mind",
          paragraphs: [
            "A client changing preferences, direction, or decision after work has begun does not automatically create a right to a refund. New requirements outside the agreed scope may be treated as additional work.",
          ],
        },
        {
          heading: "7. Client Inactivity",
          paragraphs: [
            "If a project cannot continue because the client fails to provide required information, approvals, content, or cooperation for an extended period, CyberWeel may suspend the project. If it is later terminated, completed work and actual costs may be deducted before determining any remaining balance.",
          ],
        },
        {
          heading: "8. Third-Party Costs",
          paragraphs: [
            "Amounts paid to external providers that cannot be recovered are not refundable by CyberWeel. Examples may include domains, hosting, licenses, subscriptions, APIs, AI services, and other external software or infrastructure.",
          ],
        },
        {
          heading: "9. Cancellation by CyberWeel",
          paragraphs: [
            "If CyberWeel cancels a project without a material breach by the client, completed work and actual costs will be accounted for and any eligible remaining amount relating to unperformed work may be refunded. If cancellation results from non-payment, unlawful activity, abuse, or a substantial breach, applicable obligations may still remain due.",
          ],
        },
        {
          heading: "10. Refund Requests",
          paragraphs: [
            "Refund requests should be submitted through an official CyberWeel communication channel and identify the applicable project or service and reason for the request. Each request is reviewed individually based on project records, payments, completed work, and applicable terms. Submitting a request does not guarantee approval.",
          ],
        },
        {
          heading: "11. Refund Method",
          paragraphs: [
            "Approved refunds will be returned through a practical and mutually available payment method. Processing time may depend on the financial service involved, and non-refundable banking, transfer, or payment-provider fees may be deducted where applicable.",
          ],
        },
        {
          heading: "12. Payment Disputes",
          paragraphs: [
            "Clients are encouraged to contact CyberWeel before initiating a formal payment dispute or chargeback. A payment dispute does not automatically cancel obligations relating to completed or delivered work.",
          ],
        },
        {
          heading: "13. Project-Specific Agreements",
          paragraphs: [
            "Where a contract, quotation, or project-specific agreement contains different cancellation or refund terms, those specific terms govern that project.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookie Policy",
      intro:
        "CyberWeel uses cookies and similar technologies where reasonably necessary to operate the website, protect accounts, and improve user experience.",
      blocks: [
        {
          heading: "1. What Are Cookies?",
          paragraphs: [
            "Cookies are small pieces of information stored by a browser on a user's device. They may be used to maintain sessions, remember preferences, or support technical functionality.",
          ],
        },
        {
          heading: "2. How CyberWeel May Use Cookies",
          bullets: [
            "Login sessions.",
            "Security and abuse prevention.",
            "Language and interface preferences.",
            "Essential dashboard functionality.",
            "Performance measurement and technical diagnostics where appropriate.",
          ],
        },
        {
          heading: "3. Essential Cookies",
          paragraphs: [
            "Some cookies are necessary for authentication, security, session management, or other essential site functions. Disabling them may prevent parts of CyberWeel from operating correctly.",
          ],
        },
        {
          heading: "4. Analytics and Performance",
          paragraphs: [
            "CyberWeel may use analytics or performance tools to understand website usage and improve reliability and user experience. Where such tools are used, we aim to limit collected information to what is reasonably required for the relevant purpose.",
          ],
        },
        {
          heading: "5. Third-Party Technologies",
          paragraphs: [
            "Certain external technology providers may use cookies or similar technologies according to their own policies. CyberWeel does not directly control every technology used by external providers.",
          ],
        },
        {
          heading: "6. Managing Cookies",
          paragraphs: [
            "Users may delete or block cookies through browser settings. Blocking essential cookies may interfere with login, security, or other site functionality.",
          ],
        },
        {
          heading: "7. Retention",
          paragraphs: [
            "Cookie duration varies by purpose. Some may end when the browser closes, while others may remain longer to preserve preferences or support security and operational functions.",
          ],
        },
        {
          heading: "8. Consent",
          paragraphs: [
            "Where applicable law requires user consent for non-essential cookies, those cookies should not be activated before required consent is obtained. Essential cookies may be used without separate consent where permitted by law.",
          ],
        },
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimer",
      intro:
        "CyberWeel provides digital, technical, consulting, and implementation services intended to help users and clients develop and improve digital solutions. This Disclaimer describes important limitations relating to the website, services, content, and technology we provide.",
      blocks: [
        {
          heading: "1. General Information",
          paragraphs: [
            "Information published by CyberWeel may include technical, educational, commercial, or informational content. It is provided for general purposes and is not a substitute for legal, financial, accounting, medical, or other regulated professional advice where specialist advice is required.",
          ],
        },
        {
          heading: "2. Results",
          paragraphs: [
            "CyberWeel does not guarantee specific commercial outcomes such as revenue increases, profit levels, customer acquisition, search-engine ranking, market performance, or business growth unless a specific measurable commitment has been expressly agreed in writing.",
          ],
        },
        {
          heading: "3. Software and Digital Systems",
          paragraphs: [
            "Websites, software, digital systems, and online services may experience bugs, interruptions, failures, vulnerabilities, or compatibility issues. CyberWeel aims to test and deliver work responsibly, but no digital system can be guaranteed to be completely error-free or continuously available.",
          ],
        },
        {
          heading: "4. Cybersecurity",
          paragraphs: [
            "CyberWeel may provide cybersecurity-related services and implement reasonable security measures. No internet-connected system can be guaranteed to be completely secure against every attack, vulnerability, failure, or human error.",
            "Clients remain responsible for appropriate password practices, updates, backups, access control, and other safeguards relevant to their systems.",
          ],
        },
        {
          heading: "5. Artificial Intelligence",
          paragraphs: [
            "AI systems can produce inaccurate, incomplete, outdated, or contextually inappropriate outputs. AI-generated content should be reviewed before being relied upon for important decisions.",
            "AI output should not be used as the sole basis for legal, medical, financial, security, or other high-impact decisions without appropriate qualified human review.",
          ],
        },
        {
          heading: "6. External Services",
          paragraphs: [
            "CyberWeel may rely on third-party infrastructure and services and does not control their availability, pricing, policies, outages, or technical decisions. CyberWeel is not responsible for losses directly caused by third-party failures outside its reasonable control, except where the relevant issue results from CyberWeel's own work.",
          ],
        },
        {
          heading: "7. External Links",
          paragraphs: [
            "Links to external websites do not necessarily indicate endorsement of all information, products, policies, or services provided by those websites. Users are responsible for reviewing the terms and policies of third-party services they choose to use.",
          ],
        },
        {
          heading: "8. Client Information and Decisions",
          paragraphs: [
            "Some CyberWeel services depend on information supplied by clients. CyberWeel is not responsible for results caused by inaccurate, incomplete, or outdated information supplied by a client. Clients remain responsible for business, operational, and legal decisions made in connection with their projects.",
          ],
        },
        {
          heading: "9. Changes After Delivery",
          paragraphs: [
            "CyberWeel is not responsible for problems caused by modifications made after delivery by the client or another third party outside CyberWeel's supervision. Additional support may be provided under a separate agreement.",
          ],
        },
        {
          heading: "10. Service Availability",
          paragraphs: [
            "CyberWeel seeks to maintain reliable access to its website and services. Temporary interruptions may occur due to maintenance, updates, infrastructure failures, attacks, or other technical events. Continuous uninterrupted availability cannot be guaranteed.",
          ],
        },
        {
          heading: "11. Limitation of Liability",
          paragraphs: [
            "To the extent permitted by applicable law, CyberWeel will not be responsible for indirect or consequential losses or speculative loss of future profits resulting from the use of its services. Where direct liability is established, it should be assessed in relation to the specific service involved, the applicable agreement, and the direct harm reasonably attributable to that service.",
          ],
        },
      ],
    },
  ],
};

const sectionNumber: Record<LegalSection["id"], string> = {
  privacy: "01",
  terms: "02",
  refunds: "03",
  cookies: "04",
  disclaimer: "05",
};

export function LegalPageClient() {
  return (
    <I18nProvider>
      <LegalPageInner />
    </I18nProvider>
  );
}

function LegalPageInner() {
  const { dir } = useI18n();
  const isArabic = dir === "rtl";
  const copy = isArabic ? AR : EN;

  const navigate = (view: ViewId) => {
    if (typeof window === "undefined") return;
    window.location.assign(publicViewPath(view, window.location.search));
  };

  return (
    <NavContext.Provider value={{ view: "home", navigate, openShortcuts: () => undefined }}>
      <div dir={dir} className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <main id="main" className="flex-1">
          <section className="relative overflow-hidden border-b border-border bg-ink text-floral">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(80% 120% at 85% 0%, rgba(184,154,90,0.22), transparent 58%), radial-gradient(70% 100% at 5% 100%, rgba(184,154,90,0.10), transparent 62%)",
              }}
            />
            <div className="cw-container relative py-16 sm:py-20 lg:py-24">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-[#D8D2C4]">
                  <ShieldCheck className="h-4 w-4 text-camel" />
                  {copy.eyebrow}
                </div>
                <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-[#F7F3EB] sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-[#D8D2C4] sm:text-xl">
                  {copy.subtitle}
                </p>
                <p className="mt-5 text-sm font-semibold text-camel">{copy.updated}</p>
              </div>
            </div>
          </section>

          <section className="cw-container py-10 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
              <aside className="lg:sticky lg:top-32">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-black text-ink">{copy.tocTitle}</p>
                  <nav className="mt-4 grid gap-2" aria-label={copy.tocTitle}>
                    {copy.sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="focus-ring group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-ink"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-camel/30 bg-camel/10 text-xs font-black text-camel">
                          {sectionNumber[section.id]}
                        </span>
                        <span>{section.title}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              <div className="min-w-0 space-y-10">
                {copy.sections.map((section) => (
                  <article
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-32 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-black text-floral">
                        {sectionNumber[section.id]}
                      </span>
                      <div>
                        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                          {section.title}
                        </h2>
                        {section.intro ? (
                          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                            {section.intro}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-8 space-y-8">
                      {section.blocks.map((block) => (
                        <section key={block.heading} className="border-t border-border/70 pt-7 first:border-t-0 first:pt-0">
                          <h3 className="text-lg font-black leading-7 text-ink sm:text-xl">{block.heading}</h3>
                          {block.paragraphs?.map((paragraph) => (
                            <p key={paragraph} className="mt-3 text-[15px] leading-8 text-muted-foreground sm:text-base">
                              {paragraph}
                            </p>
                          ))}
                          {block.bullets ? (
                            <ul className="mt-4 space-y-2 text-[15px] leading-7 text-muted-foreground sm:text-base">
                              {block.bullets.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                  <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-camel" aria-hidden />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </section>
                      ))}
                    </div>
                  </article>
                ))}

                <section className="rounded-3xl border border-camel/30 bg-camel/10 p-6 sm:p-8">
                  <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{copy.contactTitle}</h2>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground">{copy.contactBody}</p>
                  <p className="mt-5 text-sm font-bold text-ink">
                    {copy.emailLabel}: {" "}
                    <a className="focus-ring rounded text-camel underline decoration-camel/40 underline-offset-4 hover:decoration-camel" href="mailto:hello@cyberweel.com">
                      hello@cyberweel.com
                    </a>
                  </p>
                  <p className="mt-5 border-t border-camel/20 pt-5 text-sm leading-7 text-muted-foreground">{copy.note}</p>
                </section>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </NavContext.Provider>
  );
}
