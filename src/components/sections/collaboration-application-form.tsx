"use client";
import { FormEvent, useState } from "react";

export function CollaborationApplicationForm({ type, arabic }: { type: "PARTNER" | "AMBASSADOR"; arabic: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, name: form.get("name"), email: form.get("email"), phone: form.get("phone"), specialty: form.get("specialty"), market: form.get("market"), details: form.get("details") }) });
    setState(response.ok ? "done" : "error");
  }
  if (state === "done") return <div role="status" className="rounded-xl bg-emerald-50 p-5 font-semibold text-emerald-800">{arabic ? "تم استلام طلبك. ستراجعه الإدارة، ولن يُنشأ الحساب إلا بعد القبول." : "Application received. Administration will review it; an account is created only after approval."}</div>;
  return <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
    <input required name="name" placeholder={arabic ? "الاسم الكامل" : "Full name"} className="rounded-lg border p-3" />
    <input required type="email" name="email" placeholder={arabic ? "البريد الإلكتروني" : "Email"} className="rounded-lg border p-3" />
    <input name="phone" placeholder={arabic ? "رقم التواصل" : "Contact number"} className="rounded-lg border p-3" />
    {type === "PARTNER" ? <input required name="specialty" placeholder={arabic ? "التخصص والخبرة" : "Specialty and experience"} className="rounded-lg border p-3" /> : <input required name="market" placeholder={arabic ? "البلد أو السوق" : "Country or market"} className="rounded-lg border p-3" />}
    <textarea name="details" rows={5} placeholder={arabic ? "معلومات إضافية (اختياري)" : "Additional information (optional)"} className="rounded-lg border p-3 sm:col-span-2" />
    <p className="text-sm text-muted-foreground sm:col-span-2">{arabic ? "هذا نموذج طلب وليس تسجيلًا ذاتيًا. بعد القبول تنشئ الإدارة حسابك وترسل بيانات الدخول." : "This is an application, not self-registration. After approval, administration creates your account and sends access details."}</p>
    {state === "error" && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{arabic ? "تعذر إرسال الطلب. تحقق من البيانات وحاول مجددًا." : "Could not submit. Check the information and try again."}</p>}
    <button disabled={state === "sending"} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white sm:col-span-2">{state === "sending" ? (arabic ? "جارٍ الإرسال..." : "Submitting…") : (arabic ? "إرسال الطلب للمراجعة" : "Submit for review")}</button>
  </form>;
}
