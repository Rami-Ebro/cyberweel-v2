"use client";

import { FormEvent, useState } from "react";

export default function ShareChallengePage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), phone: form.get("phone"), notes: form.get("notes") }),
    });
    const data = await response.json();
    setLoading(false);
    setMessage(response.ok ? "وصلتنا رسالتك وسنتواصل معك قريبًا" : data.error || "تعذر الإرسال");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-12 text-[#111827]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#D8D2C4] bg-white p-7 shadow-xl">
        <p className="text-sm font-bold text-[#B89A5A]">شاركنا مشكلتك</p>
        <h1 className="mt-2 text-3xl font-black">لنبدأ من الصورة الحقيقية</h1>
        <p className="mt-3 leading-8 text-slate-600">اكتب باختصار ما الذي لا يعمل كما يجب، وسنتواصل معك لفهمه بوضوح</p>
        <form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2">
          <input name="name" required placeholder="الاسم" className="rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A] sm:col-span-2" />
          <input name="email" type="email" placeholder="البريد الإلكتروني" className="rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
          <input name="phone" placeholder="رقم الهاتف أو واتساب" className="rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
          <textarea name="notes" rows={6} placeholder="اشرح المشكلة أو الفكرة" className="rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A] sm:col-span-2" />
          <button disabled={loading} className="rounded-xl bg-[#111827] px-5 py-3 font-extrabold text-white disabled:opacity-60 sm:col-span-2">{loading ? "جارٍ الإرسال..." : "إرسال"}</button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-[#F7F3EB] p-3 font-semibold">{message}</p>}
      </div>
    </main>
  );
}
