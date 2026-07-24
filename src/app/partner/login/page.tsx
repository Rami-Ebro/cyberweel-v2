"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/partner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      router.push("/partner/dashboard");
      router.refresh();
      return;
    }
    setMessage(data.error || "تعذر تسجيل الدخول");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] px-4 py-12 text-[#111827]">
      <div className="mx-auto max-w-md rounded-3xl border border-[#D8D2C4] bg-white p-7 shadow-xl">
        <p className="text-sm font-bold text-[#B89A5A]">بوابة شركاء CyberWeel</p>
        <h1 className="mt-2 text-3xl font-black">تسجيل الدخول</h1>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input name="email" type="email" required placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none focus:border-[#B89A5A]" />
          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} required placeholder="كلمة المرور" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none focus:border-[#B89A5A]" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB]" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-[#111827] px-4 py-3 font-extrabold text-white disabled:opacity-60">{loading ? "جارٍ الدخول..." : "دخول"}</button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
        <p className="mt-6 text-sm text-slate-600">شريك جديد؟ <Link href="/partner/register" className="font-bold text-[#9A7D43]">إنشاء طلب شراكة</Link></p>
      </div>
    </main>
  );
}
