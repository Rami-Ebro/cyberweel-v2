"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";

export default function PartnerRegisterPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/partner/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password }),
    });
    const data = await response.json();
    setLoading(false);
    setMessage(
      response.ok
        ? data.status === "ACTIVE"
          ? "تم إنشاء حسابك وتفعيله. يمكنك تسجيل الدخول الآن"
          : "تم إنشاء طلبك. حسابك الآن بانتظار موافقة الإدارة"
        : data.error || "تعذر التسجيل",
    );
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-12 text-[#111827]">
      <div className="mx-auto max-w-md rounded-3xl border border-[#D8D2C4] bg-white p-7 shadow-xl">
        <p className="text-sm font-bold text-[#B89A5A]">بوابة شركاء CyberWeel</p>
        <h1 className="mt-2 text-3xl font-black">انضم كشريك</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">أنشئ طلبك، وبعد موافقة الإدارة تحصل على رابط إحالة خاص بك</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input name="name" required minLength={2} placeholder="الاسم الكامل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
          <input name="email" type="email" required placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />

          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} required minLength={8} placeholder="كلمة المرور — 8 أحرف على الأقل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required minLength={8} placeholder="تأكيد كلمة المرور" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}>
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button disabled={loading} className="w-full rounded-xl bg-[#111827] px-4 py-3 font-extrabold text-white disabled:opacity-60">{loading ? "جارٍ الإرسال..." : "إنشاء طلب الشراكة"}</button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-[#F7F3EB] p-3 text-sm font-semibold">{message}</p>}
        <p className="mt-6 text-sm text-slate-600">لديك حساب؟ <Link href="/partner/login" className="font-bold text-[#9A7D43]">تسجيل الدخول</Link></p>
      </div>
    </main>
  );
}
