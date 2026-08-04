"use client";
import { FormEvent, useState } from "react";

export function CollaborationApplicationForm({ type, arabic }: { type: "PARTNER" | "AMBASSADOR"; arabic: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [shareMessage, setShareMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, name: form.get("name"), email: form.get("email"), phone: form.get("phone"), specialty: form.get("specialty"), market: form.get("market"), details: form.get("details") }) });
    setState(response.ok ? "done" : "error");
  }
  async function shareChallenge() {
    const url = new URL("/share-challenge", window.location.origin).toString();
    const text = arabic ? "هل تعرف شخصًا لديه فكرة أو مشكلة تحتاج إلى حل؟ شارك معه الرابط، فقد تكون أنت بداية الحل." : "Know someone with an idea or problem that needs solving? Share this page—you may be the start of the solution.";
    try {
      if (navigator.share) await navigator.share({ title: "CyberWeel", text, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage(arabic ? "تم نسخ الرابط، شاركه مع من يحتاج إلى حل." : "Link copied. Share it with someone who needs a solution.");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") setShareMessage(arabic ? "تعذر فتح المشاركة. انسخ رابط صفحة شارك مشكلتك." : "Sharing could not open. Copy the Share Your Challenge page link.");
    }
  }
  if (state === "done") return <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950"><h3 className="text-xl font-black">{arabic ? "تم استلام طلبك بنجاح" : "Application received successfully"}</h3><p className="mt-3 leading-7">{arabic ? "شكرًا لانضمامك إلى شبكة شركاء CyberWeel. سيقوم فريقنا بمراجعة طلبك بعناية، وسنتواصل معك قريبًا." : "Thank you for joining the CyberWeel partner network. Our team will review your application carefully and contact you soon."}</p><div className="mt-5 border-t border-emerald-200 pt-5"><p className="leading-7">{arabic ? "هل تعرف شخصًا لديه فكرة أو مشكلة تحتاج إلى حل؟ شارك معه الرابط، فقد تكون أنت بداية الحل." : "Know someone with an idea or problem that needs solving? Share the link—you may be the start of the solution."}</p><button type="button" onClick={() => void shareChallenge()} className="mt-4 rounded-xl border border-emerald-700 bg-white px-5 py-3 font-black text-emerald-900 transition hover:bg-emerald-100">{arabic ? "شارك صفحة «شارك مشكلتك»" : "Share the ‘Share Your Challenge’ page"}</button>{shareMessage && <p className="mt-3 text-sm font-bold">{shareMessage}</p>}</div></div>;
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
