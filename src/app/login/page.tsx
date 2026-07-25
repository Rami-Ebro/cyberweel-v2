"use client";

import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          remember: form.get("remember") === "on",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "تعذر تسجيل الدخول");
        setLoading(false);
        return;
      }

      router.replace(data.redirectTo || "/partner/dashboard");
      router.refresh();
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[#F7F3EB] px-4 py-12 text-[#111827]">
      <div className="w-full max-w-md rounded-3xl border border-[#D8D2C4] bg-white p-7 shadow-xl sm:p-9">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3" aria-label="العودة إلى CyberWeel">
          <Logo size={52} />
          <span className="text-xl font-black">CyberWeel</span>
        </Link>
        <div className="mt-7 text-center">
          <p className="text-sm font-bold text-[#B89A5A]">بوابة CyberWeel</p>
          <h1 className="mt-2 text-3xl font-black">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-slate-500">سيتم فتح اللوحة المناسبة بحسب صلاحية حسابك.</p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input name="email" type="email" autoComplete="email" required disabled={loading} placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 outline-none transition focus:border-[#B89A5A] disabled:bg-slate-50" />
          <div className="relative">
            <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={loading} placeholder="كلمة المرور" className="w-full rounded-xl border border-[#D8D2C4] px-4 py-3 pl-12 outline-none transition focus:border-[#B89A5A] disabled:bg-slate-50" />
            <button type="button" disabled={loading} onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-[#F7F3EB] disabled:opacity-50" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-600">
              <input name="remember" type="checkbox" disabled={loading} className="h-4 w-4 accent-[#111827]" />
              تذكّرني
            </label>
            <Link href="/partner/forgot-password" className="font-bold text-[#9A7D43]">نسيت كلمة المرور؟</Link>
          </div>
          <button disabled={loading} aria-busy={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 font-extrabold text-white transition hover:bg-[#1F2937] disabled:cursor-wait disabled:opacity-80">
            <LogIn className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
        {message && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
        <p className="mt-6 text-center text-sm text-slate-600">ترغب بالانضمام كشريك؟ <Link href="/partner/register" className="font-bold text-[#9A7D43]">إنشاء طلب شراكة</Link></p>
      </div>
    </main>
  );
}
