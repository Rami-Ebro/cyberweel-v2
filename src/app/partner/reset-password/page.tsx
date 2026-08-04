"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

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
    const response = await fetch("/api/partner/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "تعذر تغيير كلمة المرور");
      return;
    }

    setDone(true);
    setMessage("تم تغيير كلمة المرور بنجاح");
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-[#D8D2C4] bg-white p-7 shadow-xl">
      <p className="text-sm font-bold text-[#B89A5A]">بوابة حسابات CyberWeel</p>
      <h1 className="mt-2 text-3xl font-black">كلمة مرور جديدة</h1>

      {!token ? (
        <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">رابط الاستعادة غير مكتمل</p>
      ) : !done ? (
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} required minLength={8} placeholder="كلمة المرور الجديدة — 8 أحرف على الأقل" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <input name="confirmPassword" type={showConfirm ? "text" : "password"} required minLength={8} placeholder="تأكيد كلمة المرور الجديدة" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
            <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showConfirm ? "إخفاء التأكيد" : "إظهار التأكيد"}>
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button disabled={loading} className="w-full rounded-xl bg-[#111827] px-4 py-3 font-extrabold text-white disabled:opacity-60">{loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}</button>
        </form>
      ) : null}

      {message && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${done ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
      <p className="mt-6 text-sm text-slate-600"><Link href="/login" className="font-bold text-[#9A7D43]">العودة إلى تسجيل الدخول</Link></p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-12 text-[#111827]">
      <Suspense fallback={<div className="mx-auto max-w-md rounded-3xl border border-[#D8D2C4] bg-white p-7 text-center shadow-xl">جارٍ تحميل صفحة الاستعادة...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
