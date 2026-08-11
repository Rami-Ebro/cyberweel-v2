"use client";

import { FormEvent, useRef, useState } from "react";

const workAreas = ["البرمجة والتطوير", "التصميم وتجربة المستخدم", "التسويق الرقمي", "تحليل الأعمال", "الذكاء الاصطناعي والأتمتة", "إدارة المشاريع", "صناعة المحتوى"];
const services = ["مواقع ومتاجر إلكترونية", "تطبيقات", "أتمتة وذكاء اصطناعي", "تصميم وهوية", "تسويق ومحتوى", "دعم تقني", "تحليل واستشارات"];
const cooperation = ["تنفيذ مشاريع", "دعم العملاء", "متابعة العملاء", "خدمات تقنية", "استشارات"];
const payments = ["شام كاش", "حوالة مالية", "تحويل بنكي", "أخرى"];

function CheckGroup({ name, options, step }: { name: string; options: string[]; step: number }) {
  return <div className="grid gap-2 sm:grid-cols-2">{options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3"><input data-step={step} type="checkbox" name={name} value={option} className="size-4 accent-ink" /><span>{option}</span></label>)}</div>;
}

function PartnerWizard({ arabic }: { arabic: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [availability, setAvailability] = useState("");
  const [otherPayment, setOtherPayment] = useState(false);

  function next() {
    const form = formRef.current;
    if (!form) return;
    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${step}"]`));
    if (!fields.every((field) => field.reportValidity())) return;
    const requiredGroup = step === 2 ? ["workAreas", "supportServices"] : step === 4 ? ["cooperationTypes"] : step === 6 ? ["paymentMethods"] : [];
    for (const name of requiredGroup) {
      if (!form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)) {
        form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.focus();
        setState("error");
        return;
      }
    }
    setState("idle");
    setStep((value) => Math.min(6, value + 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 6) return next();
    const form = new FormData(event.currentTarget);
    if (!form.getAll("paymentMethods").length) return setState("error");
    setState("sending");
    const body = Object.fromEntries(form.entries()) as Record<string, FormDataEntryValue>;
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, type: "PARTNER", workAreas: form.getAll("workAreas"), supportServices: form.getAll("supportServices"), cooperationTypes: form.getAll("cooperationTypes"), paymentMethods: form.getAll("paymentMethods") }),
    });
    setState(response.ok ? "done" : "error");
  }

  if (state === "done") return <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950"><h3 className="text-xl font-black">{arabic ? "تم إرسال طلب الشراكة بنجاح." : "Partnership application submitted successfully."}</h3><p className="mt-3 leading-7">{arabic ? "سيتم مراجعة البيانات وتفعيل الحساب بعد الموافقة من الإدارة." : "Your information will be reviewed and the account activated after administrative approval."}</p><p className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black">{arabic ? "حالة الطلب: قيد المراجعة" : "Application status: Under review"}</p></div>;

  const titles = ["البيانات الأساسية", "معلومات العمل", "القدرة والتفرغ", "طريقة التعاون", "نبذة قصيرة", "معلومات الدفع"];
  const field = "w-full rounded-xl border bg-white p-3 outline-none focus:border-ink";
  return <form ref={formRef} onSubmit={submit} className="space-y-6">
    <div aria-label="تقدم التسجيل"><div className="mb-2 flex items-center justify-between text-sm font-bold"><span>{titles[step - 1]}</span><span>{step} / 6</span></div><div className="h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full bg-gold transition-all" style={{ width: `${step / 6 * 100}%` }} /></div></div>
    <section className={step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
      <input data-step="1" required name="name" maxLength={120} placeholder="الاسم الكامل" className={field} />
      <input data-step="1" required type="email" name="email" maxLength={254} placeholder="البريد الإلكتروني" className={field} />
      <input data-step="1" required name="phone" maxLength={40} placeholder="رقم الهاتف" className={field} />
      <input data-step="1" required name="countryRegion" maxLength={120} placeholder="الدولة / المنطقة" className={field} />
      <select data-step="1" required name="partnerType" defaultValue="" className={`${field} sm:col-span-2`}><option value="" disabled>نوع الشريك</option><option>فرد مستقل</option><option>فريق أو شركة</option><option>مستشار متخصص</option></select>
    </section>
    <section className={step === 2 ? "space-y-5" : "hidden"}><div><h4 className="mb-2 font-black">مجال العمل</h4><CheckGroup name="workAreas" options={workAreas} step={2} /></div><div><h4 className="mb-2 font-black">الخدمات أو المجالات التي تستطيع دعمها</h4><CheckGroup name="supportServices" options={services} step={2} /></div><div className="grid gap-4 sm:grid-cols-2"><select data-step="2" required name="experienceLevel" defaultValue="" className={field}><option value="" disabled>مستوى الخبرة</option>{["مبتدئ", "متوسط", "متقدم", "خبير"].map((v) => <option key={v}>{v}</option>)}</select><input data-step="2" required type="number" min="0" max="70" name="experienceYears" placeholder="عدد سنوات الخبرة" className={field} /></div></section>
    <section className={step === 3 ? "space-y-4" : "hidden"}><select data-step="3" required name="availabilityType" defaultValue="" onChange={(e) => setAvailability(e.target.value)} className={field}><option value="" disabled>نوع التفرغ</option><option value="FULL_TIME">متفرغ بالكامل</option><option value="PART_TIME">متفرغ جزئياً</option></select>{availability === "PART_TIME" && <input data-step="3" required type="number" min="1" max="168" name="weeklyHours" placeholder="عدد الساعات المتاحة أسبوعياً" className={field} />}</section>
    <section className={step === 4 ? "space-y-3" : "hidden"}><h4 className="font-black">نوع التعاون المفضل</h4><CheckGroup name="cooperationTypes" options={cooperation} step={4} /></section>
    <section className={step === 5 ? "space-y-3" : "hidden"}><label className="font-black" htmlFor="shortBio">نبذة قصيرة عنك أو عن خبرتك <span className="font-normal text-muted-foreground">(اختياري)</span></label><textarea data-step="5" id="shortBio" name="shortBio" maxLength={2000} rows={6} className={field} /></section>
    <section className={step === 6 ? "space-y-4" : "hidden"}><h4 className="font-black">طرق الدفع المعتمدة</h4><div onChange={() => setOtherPayment(Boolean(formRef.current?.querySelector('input[name="paymentMethods"][value="أخرى"]:checked')))}><CheckGroup name="paymentMethods" options={payments} step={6} /></div>{otherPayment && <input data-step="6" required name="otherPaymentMethod" maxLength={120} placeholder="اكتب طريقة الدفع الأخرى" className={field} />}</section>
    {state === "error" && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">يرجى إكمال الحقول المطلوبة في هذه المرحلة والتأكد من صحة البيانات.</p>}
    <div className="flex gap-3"><button type="button" disabled={step === 1 || state === "sending"} onClick={() => { setState("idle"); setStep((v) => Math.max(1, v - 1)); }} className="rounded-xl border px-6 py-3 font-black disabled:opacity-40">السابق</button>{step < 6 ? <button type="button" onClick={next} className="flex-1 rounded-xl bg-ink px-6 py-3 font-black text-white">التالي</button> : <button disabled={state === "sending"} className="flex-1 rounded-xl bg-ink px-6 py-3 font-black text-white">{state === "sending" ? "جارٍ الإرسال..." : "إرسال الطلب للمراجعة"}</button>}</div>
  </form>;
}

function AmbassadorForm({ arabic }: { arabic: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setState("sending"); const form = new FormData(event.currentTarget); const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "AMBASSADOR", name: form.get("name"), email: form.get("email"), phone: form.get("phone"), market: form.get("market"), details: form.get("details") }) }); setState(response.ok ? "done" : "error"); }
  if (state === "done") return <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 font-bold text-emerald-950">{arabic ? "تم استلام طلبك بنجاح وسيقوم فريقنا بمراجعته." : "Application received. Our team will review it."}</div>;
  return <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><input required name="name" placeholder={arabic ? "الاسم الكامل" : "Full name"} className="rounded-lg border p-3" /><input required type="email" name="email" placeholder={arabic ? "البريد الإلكتروني" : "Email"} className="rounded-lg border p-3" /><input name="phone" placeholder={arabic ? "رقم التواصل" : "Contact number"} className="rounded-lg border p-3" /><input required name="market" placeholder={arabic ? "البلد أو السوق" : "Country or market"} className="rounded-lg border p-3" /><textarea name="details" rows={5} placeholder={arabic ? "معلومات إضافية (اختياري)" : "Additional information (optional)"} className="rounded-lg border p-3 sm:col-span-2" />{state === "error" && <p className="text-red-700 sm:col-span-2">تعذر إرسال الطلب.</p>}<button disabled={state === "sending"} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white sm:col-span-2">{arabic ? "إرسال الطلب للمراجعة" : "Submit for review"}</button></form>;
}

export function CollaborationApplicationForm({ type, arabic }: { type: "PARTNER" | "AMBASSADOR"; arabic: boolean }) {
  return type === "PARTNER" ? <PartnerWizard arabic={arabic} /> : <AmbassadorForm arabic={arabic} />;
}
