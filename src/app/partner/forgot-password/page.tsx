"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/partner/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const data = await response.json();
    setLoading(false);
    setMessage(response.ok ? data.message : data.error || "تعذر إرسال الطلب");
    if (response.ok && data.resetUrl) setResetUrl(data.resetUrl);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-12 text-[#111827]">
      <div className="mx-auto max-w-md rounded-3xl border border-[#D8D2C4] bg-white p-7 shadow-xl">
        <p className="text-sm font-bold text-[#B89A5A]">بوابة شركاء CyberWeel</p>
        <h1 className="mt-2 text-3xl font-black">نسيت كلمة المرور؟</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">أدخل بريدك المسجل وسنرسل لك رابطًا آمنًا صالحًا لمدة 30 دقيقة</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <input name="email" type="email" required placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
          <button disabled={loading} className="w-full rounded-xl bg-[#111827] px-4 py-3 font-extrabold text-white disabled:opacity-60">{loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}</button>
        </form>

        {message && <p className="mt-4 rounded-xl bg-[#F7F3EB] p-3 text-sm font-semibold">{message}</p>}
        {resetUrl && (
          <a href={resetUrl} className="mt-3 block rounded-xl border border-[#B89A5A] p-3 text-center text-sm font-bold text-[#9A7D43]">فتح رابط الاستعادة التجريبي</a>
        )}

        <p className="mt-6 text-sm text-slate-600"><Link href="/partner/login" className="font-bold text-[#9A7D43]">العودة إلى تسجيل الدخول</Link></p>
      </div>
    </main>
  );
}
