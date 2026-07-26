"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LogIn, ShieldCheck, UserPlus } from "lucide-react";
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
          identifier: form.get("identifier"),
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

      router.replace("/");
      router.refresh();
    } catch {
      setMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F3EB] text-[#111827]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-12">
        <section className="order-2 rounded-[2rem] bg-[#111827] p-7 text-white shadow-2xl sm:p-10 lg:order-1">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="العودة إلى CyberWeel">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white"><Logo size={42} /></span>
            <span>
              <strong className="block text-xl font-black">CyberWeel</strong>
              <span className="text-xs text-white/50">شريكك للتقدّم</span>
            </span>
          </Link>

          <div className="mt-12 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-[#D6BC7A]">
              <ShieldCheck className="h-4 w-4" />
              حساب واحد لجميع خدماتك
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">ادخل إلى حسابك بكل سهولة وأمان.</h2>
            <p className="mt-5 text-base leading-8 text-white/65">تابع مشاريعك، إحالاتك، ملفاتك وفواتيرك من خلال حساب CyberWeel واحد.</p>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-bold text-white/55">ليس لديك حساب؟</p>
            <h3 className="mt-2 text-2xl font-black">أنشئ حسابًا جديدًا</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">أنشئ حسابك في CyberWeel للوصول إلى خدماتك وإدارة بياناتك بسهولة، مع الحفاظ على خصوصيتك وأمان معلوماتك.</p>
            <Link href="/partner/register" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#B89A5A] px-5 py-3 font-black text-[#111827] transition hover:bg-[#C9AB69]">
              <UserPlus className="h-5 w-5" />
              إنشاء حساب جديد
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="order-1 rounded-[2rem] border border-[#D8D2C4] bg-white p-6 shadow-xl sm:p-9 lg:order-2">
          <div className="text-center">
            <p className="text-sm font-black text-[#9A7D43]">هل لديك حساب؟</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">تسجيل الدخول</h1>
            <p className="mt-3 text-sm text-slate-500">استخدم بريدك الإلكتروني أو رقم واتساب المرتبط بحسابك.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black">البريد الإلكتروني أو رقم واتساب</label>
              <input name="identifier" type="text" autoComplete="username" required disabled={loading} placeholder="name@example.com أو +963..." className="w-full rounded-2xl border border-[#D8D2C4] bg-white px-4 py-3.5 outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10 disabled:bg-slate-50" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black">كلمة المرور</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={loading} placeholder="أدخل كلمة المرور" className="w-full rounded-2xl border border-[#D8D2C4] px-4 py-3.5 pl-12 outline-none transition focus:border-[#B89A5A] focus:ring-4 focus:ring-[#B89A5A]/10 disabled:bg-slate-50" />
                <button type="button" disabled={loading} onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-[#F7F3EB] disabled:opacity-50" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input name="remember" type="checkbox" disabled={loading} className="h-4 w-4 accent-[#111827]" />
                تذكّرني
              </label>
              <Link href="/partner/forgot-password" className="font-black text-[#9A7D43] transition hover:text-[#111827]">نسيت كلمة المرور؟</Link>
            </div>

            <button disabled={loading} aria-busy={loading} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 py-3.5 font-black text-white shadow-lg transition hover:bg-[#1F2937] disabled:cursor-wait disabled:opacity-75">
              <LogIn className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          {message && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{message}</p>}

          <div className="mt-7 border-t border-[#EEE8DC] pt-6 text-center sm:hidden">
            <p className="text-sm text-slate-500">ليس لديك حساب؟</p>
            <Link href="/partner/register" className="mt-2 inline-flex items-center gap-2 font-black text-[#9A7D43]">
              إنشاء حساب جديد
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
